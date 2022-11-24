const React = require('react');
const classnames = require('classnames');
const hat = require('hat');
const StremioVideo = require('@stremio/stremio-video');
const styles = require('./styles');

const CHROMECAST_NAMESPACE = 'urn:x-cast:com.stremio';
const CHUNK_SIZE = 20000;

const App = () => {
    const videoElementRef = React.useRef(null);
    const [loaded, setLoaded] = React.useState(false);
    React.useEffect(() => {
        const context = cast.framework.CastReceiverContext.getInstance();
        const video = new StremioVideo();
        const messages = {};
        const emit = (args) => {
            // eslint-disable-next-line no-console
            console.log('emit', args);
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
            const id = hat();
            chunks.map((chunk, index) => {
                context.sendCustomMessage(CHROMECAST_NAMESPACE, undefined, {
                    id,
                    chunk,
                    index,
                    length: chunks.length
                });
            });
        };
        const dispatch = (action) => {
            // eslint-disable-next-line no-console
            console.log('dispatch', action);
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
        const onCustomMessage = (event) => {
            try {
                const { id, chunk, index, length } = event.data;
                messages[id] = messages[id] || [];
                messages[id][index] = chunk;
                if (Object.keys(messages[id]).length === length) {
                    const action = JSON.parse(messages[id].join(''));
                    delete messages[id];
                    dispatch(action);
                }
            } catch (error) {
                emit({
                    event: 'error',
                    args: [Object.assign({}, StremioVideo.ERROR.CHROMECAST_SENDER_VIDEO.MESSAGE_SEND_FAILED, {
                        error
                    })]
                });
            }
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
            alert(JSON.stringify(error));
            document.getElementById('error').innerText = JSON.stringify(error);
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
                        {/* <img className={styles['logo']} src={require('/images/stremio_symbol.png')} alt={' '} loading={'lazy'} /> */}
                        <div className={styles['label']}>Stremio Chromecast Receiver development {process.env.COMMIT_HASH} {JSON.stringify(window.result)}</div>
                        <div className={styles['label']} id={'error'} />
                    </div>
                    :
                    null
            }
        </div>
    );
};

module.exports = App;
