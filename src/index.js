const React = require('react');
const ReactDOM = require('react-dom');
const App = require('./App');

navigator.mediaCapabilities.decodingInfo({
    type: 'file',
    audio: {
        contentType: 'audio/mp4; codecs="mp4a.40.2"',
        channels: 6,
        bitrate: 132700,
        samplerate: 48000
    }
}).then((aacResult) => {
    window.aacResult = {
        supported: aacResult.supported,
        powerEfficient: aacResult.powerEfficient,
        smooth: aacResult.smooth
    };
    ReactDOM.render(<App />, document.getElementById('app'));
});
