const React = require('react');
const ReactDOM = require('react-dom');
const App = require('./App');

const tests = [
    {
        type: 'media-source',
        audio: {
            contentType: 'audio/mp4; codecs="mp4a.40.2"',
            channels: '6',
            bitrate: 132266,
            samplerate: 48000
        }
    },
    {
        type: 'media-source',
        audio: {
            contentType: 'audio/mp4; codecs="mp4a.40.2"',
            channels: 6,
            bitrate: 132266,
            samplerate: 48000
        }
    },
    {
        type: 'file',
        audio: {
            contentType: 'audio/mp4; codecs="mp4a.40.2"',
            channels: '6',
            bitrate: 132700,
            samplerate: 48000
        }
    },
    {
        type: 'file',
        audio: {
            contentType: 'audio/mp4; codecs="mp4a.40.2"',
            channels: 6,
            bitrate: 132700,
            samplerate: 48000
        }
    },
    {
        type: 'file',
        audio: {
            contentType: 'audio/mp4; codecs="mp4a.40.2"',
            channels: '5.1',
            bitrate: 132700,
            samplerate: 48000
        }
    }
].map((config) => navigator.mediaCapabilities.decodingInfo(config));

Promise.allSettled(tests).then((results) => {
    window.result = results.map((result) => result.value || result.reason);
    ReactDOM.render(<App />, document.getElementById('app'));
});
