/*
 * Copyright 2018 Jiří Janoušek <janousek.jiri@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

(function (Nuvola) {
  const PlaybackState = Nuvola.PlaybackState
  const PlayerAction = Nuvola.PlayerAction

  const player = Nuvola.$object(Nuvola.MediaPlayer)
  const WebApp = Nuvola.$WebApp()

  // Initialization routines
  WebApp._onInitWebWorker = function (emitter) {
    Nuvola.WebApp._onInitWebWorker.call(this, emitter)

    const state = document.readyState
    if (state === 'interactive' || state === 'complete') {
      this._onPageReady()
    } else {
      document.addEventListener('DOMContentLoaded', this._onPageReady.bind(this))
    }
  }

  // Page is ready for magic
  WebApp._onPageReady = function () {
    Nuvola.actions.connect('ActionActivated', this)
    this.update()
  }

  // Extract data from the web page
  WebApp.update = function () {
    let state = PlaybackState.UNKNOWN
    const elms = this.getElements()
    const track = {
      title: null,
      artist: null,
      album: null,
      artLocation: null,
      rating: null
    }
    player.setTrack(track)

    if (elms.play) {
      state = PlaybackState.PAUSED
    } else if (elms.pause) {
      state = PlaybackState.PLAYING
    }

    player.setPlaybackState(state)
    player.setCanPlay(!!elms.play)
    player.setCanPause(!!elms.pause)
    player.setCanGoPrev(!!elms.prev)
    player.setCanGoNext(!!elms.next)

    const volume = elms.volumeMark ? elms.volumeMark.style.width.replace('%', '') / 100 : null
    player.updateVolume(volume)
    player.setCanChangeVolume(!!elms.volumeBar)

    // Schedule the next update
    setTimeout(this.update.bind(this), 500)
  }

  WebApp._onActionActivated = function (emitter, name, param) {
    const elms = this.getElements()
    switch (name) {
      case PlayerAction.TOGGLE_PLAY:
        Nuvola.clickOnElement(elms.pause || elms.play)
        break
      case PlayerAction.PLAY:
        Nuvola.clickOnElement(elms.play)
        break
      case PlayerAction.PAUSE:
      case PlayerAction.STOP:
        Nuvola.clickOnElement(elms.pause)
        break
      case PlayerAction.NEXT_SONG:
        Nuvola.clickOnElement(elms.next)
        break
      case PlayerAction.CHANGE_VOLUME:
        Nuvola.clickOnElement(elms.volumeBar, param, 0.5)
        break
    }
  }

  WebApp.getElements = function () {
    const elms = {
      volumeMark: document.querySelector('[class^="modules-music-player-css-Controls__volume___"] .rc-slider-track'),
      volumeBar: document.querySelector('[class^="modules-music-player-css-Controls__volume___"] .rc-slider-rail')
    }
    const playPause = document.querySelector('button[class^="modules-music-player-css-PlayControl__wrapper"]')
    elms.pause = playPause && playPause.querySelector('[class*="PlayControl__pause"]') ? playPause : null
    elms.play = playPause && playPause.querySelector('[class*="PlayControl__play"]') ? playPause : null
    if (elms.play || elms.pause) {
      elms.next = document.querySelector('a[class*="modules-music-player-css-Skip__skip___"]')
    }
    return elms
  }

  WebApp.start()
})(this) // function(Nuvola)
