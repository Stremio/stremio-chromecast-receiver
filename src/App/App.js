const React = require('react');
const classnames = require('classnames');
const { StremioVideo } = require('@stremio/stremio-video');
const styles = require('./styles');

const CHROMECAST_NAMESPACE = 'urn:x-cast:com.stremio';

const App = () => {
    const videoElementRef = React.useRef(null);
    const [loaded, setLoaded] = React.useState(false);
    React.useEffect(() => {
        const context = cast.framework.CastReceiverContext.getInstance();
        const video = new StremioVideo({
            containerElement: videoElementRef.current
        });
        const emit = (args) => {
            context.sendCustomMessage(CHROMECAST_NAMESPACE, undefined, JSON.stringify(args, (_, value) => {
                if (value instanceof Error) {
                    return {
                        message: value.message,
                        stack: value.stack
                    };
                }
                if (value instanceof MediaError) {
                    return {
                        message: value.message,
                        code: value.code
                    };
                }
                return value;
            }));
        };
        const dispatch = (action) => {
            try {
                if (action && action.type === 'command' && action.commandName === 'load' && action.commandArgs) {
                    video.dispatch({
                        ...action,
                        commandArgs: {
                            ...action.commandArgs,
                            audioChannels: 2
                        }
                    });
                    return;
                }

                video.dispatch(action);
            } catch (error) {
                console.error('StremioVideo', error);
            }
        };
        const onCustomMessage = (event) => {
            dispatch(event.data);
        };
        video.on('propValue', (propName, propValue) => {
            if (propName === 'stream') {
                setLoaded(propValue !== null);
            }

            emit({ event: 'propValue', args: [propName, propValue] });
        });
        video.on('propChanged', (propName, propValue) => {
            if (propName === 'stream') {
                setLoaded(propValue !== null);
            }

            emit({ event: 'propChanged', args: [propName, propValue] });
        });
        video.on('error', (error) => {
            emit({ event: 'error', args: [error] });
        });
        video.on('ended', () => {
            emit({ event: 'ended' });
        });
        video.on('subtitlesTrackLoaded', (track) => {
            emit({ event: 'subtitlesTrackLoaded', args: [track] });
        });
        video.on('extraSubtitlesTrackLoaded', (track) => {
            emit({ event: 'extraSubtitlesTrackLoaded', args: [track] });
        });
        video.on('implementationChanged', (manifest) => {
            emit({ event: 'implementationChanged', args: [manifest] });
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
        <div className={styles['app-container']}>
            <div className={classnames(styles['layer'], styles['video-layer'])}>
                <div ref={videoElementRef} className={styles['video']} />
            </div>
            {
                !loaded ?
                    <div className={classnames(styles['layer'], styles['info-layer'])}>
                        Stremio Chromecast Receiver v{process.env.VERSION}{'\n'}{process.env.COMMIT_HASH}
                    </div>
                    :
                    null
            }
        </div>
    );
};

module.exports = App;
