/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
import Constants from '../constants/Constants';
import FactoryMaker from '../../core/FactoryMaker';
import TextSourceBuffer from './TextSourceBuffer';
import TextTracks from './TextTracks';
import VTTParser from '../utils/VTTParser';
import TTMLParser from '../utils/TTMLParser';

function TextController() {

    let context = this.context;
    let instance;
    let textSourceBuffer;

    let allTracksAreDisabled,
        errHandler,
        dashManifestModel,
        manifestModel,
        mediaController,
        videoModel,
        streamController,
        textTracks,
        vttParser,
        ttmlParser;

    function setup() {

        textTracks = TextTracks(context).getInstance();
        vttParser = VTTParser(context).getInstance();
        ttmlParser = TTMLParser(context).getInstance();
        textSourceBuffer = TextSourceBuffer(context).getInstance();

        textTracks.initialize();

        resetInitialSettings();
    }

    function setConfig(config) {
        if (!config) {
            return;
        }
        if (config.errHandler) {
            errHandler = config.errHandler;
        }
        if (config.dashManifestModel) {
            dashManifestModel = config.dashManifestModel;
        }
        if (config.manifestModel) {
            manifestModel = config.manifestModel;
        }
        if (config.mediaController) {
            mediaController = config.mediaController;
        }
        if (config.videoModel) {
            videoModel = config.videoModel;
        }
        if (config.streamController) {
            streamController = config.streamController;
        }
        if (config.textTracks) {
            textTracks = config.textTracks;
        }
        if (config.vttParser) {
            vttParser = config.vttParser;
        }
        if (config.ttmlParser) {
            ttmlParser = config.ttmlParser;
        }

        // create config for source buffer
        textSourceBuffer.setConfig({
            errHandler: errHandler,
            dashManifestModel: dashManifestModel,
            manifestModel: manifestModel,
            mediaController: mediaController,
            videoModel: videoModel,
            streamController: streamController,
            textTracks: textTracks,
            vttParser: vttParser,
            ttmlParser: ttmlParser
        });
    }

    function getTextSourceBuffer() {
        return textSourceBuffer;
    }

    function getAllTracksAreDisabled() {
        return allTracksAreDisabled;
    }

    function addEmbeddedTrack(mediaInfo) {
        textSourceBuffer.addEmbeddedTrack(mediaInfo);
    }

    function setTextTrack(idx) {
        //For external time text file,  the only action needed to change a track is marking the track mode to showing.
        // Fragmented text tracks need the additional step of calling TextController.setTextTrack();

        let config = textSourceBuffer.getConfig();
        let fragmentModel = config.fragmentModel;
        let fragmentedTracks = config.fragmentedTracks;

        let oldTrackIdx = textTracks.getCurrentTrackIdx();
        if (oldTrackIdx !== idx) {
            textTracks.setModeForTrackIdx(oldTrackIdx, Constants.TEXT_HIDDEN);
            textTracks.setCurrentTrackIdx(idx);
            textTracks.setModeForTrackIdx(idx, Constants.TEXT_SHOWING);

            let currentTrackInfo = textTracks.getCurrentTrackInfo();

            if (currentTrackInfo && currentTrackInfo.isFragmented && !currentTrackInfo.isEmbedded) {
                for (let i = 0; i < fragmentedTracks.length; i++) {
                    let mediaInfo = fragmentedTracks[i];
                    if (currentTrackInfo.lang === mediaInfo.lang && currentTrackInfo.index === mediaInfo.index &&
                        (currentTrackInfo.label ? currentTrackInfo.label === mediaInfo.id : true)) {
                        let currentFragTrack = mediaController.getCurrentTrackFor(Constants.FRAGMENTED_TEXT, streamController.getActiveStreamInfo());
                        if (mediaInfo !== currentFragTrack) {
                            fragmentModel.abortRequests();
                            textTracks.deleteCuesFromTrackIdx(oldTrackIdx);
                            mediaController.setTrack(mediaInfo);
                            textSourceBuffer.setCurrentFragmentedTrackIdx(i);
                        }
                    }
                }
            }
        }

        allTracksAreDisabled = idx === -1 ? true : false;
    }

    function getCurrentTrackIdx() {
        let textTracks = textSourceBuffer.getConfig().textTracks;
        return textTracks.getCurrentTrackIdx();
    }

    function resetInitialSettings() {
        allTracksAreDisabled = false;
    }

    function reset() {
        resetInitialSettings();
        textSourceBuffer.resetEmbedded();
    }

    instance = {
        setConfig: setConfig,
        getTextSourceBuffer: getTextSourceBuffer,
        getAllTracksAreDisabled: getAllTracksAreDisabled,
        addEmbeddedTrack: addEmbeddedTrack,
        setTextTrack: setTextTrack,
        getCurrentTrackIdx: getCurrentTrackIdx,
        reset: reset
    };
    setup();
    return instance;
}

TextController.__dashjs_factory_name = 'TextController';
export default FactoryMaker.getSingletonFactory(TextController);
