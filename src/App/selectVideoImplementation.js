const { HTMLVideo, YouTubeVideo, withStreamingServer, withHTMLSubtitles } = require('@stremio/stremio-video');

const selectVideoImplementation = (args) => {
    // TODO handle stream.behaviorHints
    // TODO handle IFrameVideo
    // TODO handle MPVVideo

    if (args.stream && typeof args.stream.ytId === 'string') {
        return withHTMLSubtitles(YouTubeVideo);
    }

    if (typeof args.streamingServerURL === 'string') {
        return withHTMLSubtitles(withStreamingServer(HTMLVideo));
    }

    return withHTMLSubtitles(HTMLVideo);
};

module.exports = selectVideoImplementation;
