const React = require('react');
const classnames = require('classnames');
const StremioVideo = require('@stremio/stremio-video');
const styles = require('./styles');

const CHROMECAST_NAMESPACE = 'urn:x-cast:com.stremio';
const CHUNK_SIZE = 5000;

const App = () => {
    const videoElementRef = React.useRef(null);
    const [loaded, setLoaded] = React.useState(false);
    React.useEffect(() => {
        const context = cast.framework.CastReceiverContext.getInstance();
        const video = new StremioVideo();
        const emit = (args) => {
            const serializedMessage = JSON.stringify(args, (_, value) => {
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
            });
            const chunksCount = Math.ceil(serializedMessage.length / CHUNK_SIZE);
            const chunks = [];
            for (let i = 0; i < chunksCount; i++) {
                const start = i * CHUNK_SIZE;
                const chunk = serializedMessage.slice(start, start + CHUNK_SIZE);
                chunks.push(chunk);
            }

            chunks.map((chunk, index) => {
                context.sendCustomMessage(CHROMECAST_NAMESPACE, undefined, {
                    chunk,
                    end: index === chunks.length - 1,
                });
            });
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
                    }, {
                        containerElement: videoElementRef.current
                    });
                    return;
                }

                video.dispatch(action);
            } catch (error) {
                console.error('StremioVideo', error);
            }
        };
        const chunks = [];
        const onCustomMessage = (event) => {
            const { chunk, end } = event.data;
            chunks.push(chunk);
            if (!end) {
                return;
            }

            dispatch(JSON.parse(chunks.splice(0, chunks.length).join('')));
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
        video.on('audioTrackLoaded', (track) => {
            emit({ event: 'audioTrackLoaded', args: [track] });
        });
        video.on('extraSubtitlesTrackLoaded', (track) => {
            emit({ event: 'extraSubtitlesTrackLoaded', args: [track] });
        });
        video.on('implementationChanged', (manifest) => {
            emit({ event: 'implementationChanged', args: [manifest] });
        });
        context.addCustomMessageListener(CHROMECAST_NAMESPACE, onCustomMessage);
        context.setLoggerLevel(process.env.DEBUG ? cast.framework.LoggerLevel.DEBUG : cast.framework.LoggerLevel.NONE);
        const options = new cast.framework.CastReceiverOptions();
        options.disableIdleTimeout = true;
        options.mediaElement = videoElementRef.current;
        context.start(options);
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
                        <img className={styles['logo']} src={require('/images/stremio_symbol.png')} alt={' '} loading={'lazy'} />
                        <div className={styles['label']}>Stremio Chromecast Receiver v{process.env.VERSION}</div>
                    </div>
                    :
                    null
            }
        </div>
    );
};

module.exports = App;
