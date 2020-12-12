const React = require('react');
const styles = require('./styles');
const { HTMLVideo, withHTMLSubtitles, withStreamingServer } = require('@stremio/stremio-video');

const CHROMECAST_NAMESPACE = 'urn:x-cast:com.stremio';
const Video = withHTMLSubtitles(withStreamingServer(HTMLVideo));

const App = () => {
    const videoElementRef = React.useRef(null);
    React.useEffect(() => {
        const context = cast.framework.CastReceiverContext.getInstance();
        const video = new Video({ containerElement: videoElementRef.current });
        const emit = (args) => {
            context.sendCustomMessage(CHROMECAST_NAMESPACE, undefined, args);
        };
        const dispatch = (args) => {
            try {
                video.dispatch(args);
            } catch (error) {
                console.error(video.constructor.manifest.name, error);
            }
        };
        const onCustomMessage = (event) => {
            dispatch(event.data);
        };
        video.on('extraSubtitlesTrackLoaded', (track) => {
            emit({ event: 'extraSubtitlesTrackLoaded', args: [track] });
        });
        video.on('subtitlesTrackLoaded', (track) => {
            emit({ event: 'subtitlesTrackLoaded', args: [track] });
        });
        video.on('error', (error) => {
            emit({ event: 'error', args: [error] });
        });
        video.on('ended', () => {
            emit({ event: 'ended' });
        });
        video.on('propValue', (propName, propValue) => {
            emit({ event: 'propValue', args: [propName, propValue] });
        });
        video.on('propChanged', (propName, propValue) => {
            emit({ event: 'propChanged', args: [propName, propValue] });
        });
        context.addCustomMessageListener(CHROMECAST_NAMESPACE, onCustomMessage);
        context.setLoggerLevel(process.env.DEBUG ? cast.framework.LoggerLevel.DEBUG : cast.framework.LoggerLevel.NONE);
        context.start();
        return () => {
            dispatch({ commandName: 'destroy' });
            context.removeCustomMessageListener(CHROMECAST_NAMESPACE, onCustomMessage);
            context.stop();
        };
    }, []);
    return (
        <div className={styles['video-container']}>
            <div ref={videoElementRef} className={styles['video']} />
        </div>
    );
};

module.exports = App;
