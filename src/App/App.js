const React = require('react');
const styles = require('./styles');

const App = () => {
    const context = React.useMemo(() => {
        return cast.framework.CastReceiverContext.getInstance();
    }, []);
    React.useEffect(() => {
        const onCustomMessage = (event) => {
            context.sendCustomMessage('urn:x-cast:com.stremio', undefined, event);
        };
        context.addCustomMessageListener('urn:x-cast:com.stremio', onCustomMessage);
        context.setLoggerLevel(process.env.DEBUG ? cast.framework.LoggerLevel.DEBUG : cast.framework.LoggerLevel.NONE);
        context.start();
        return () => {
            context.removeCustomMessageListener('urn:x-cast:com.stremio', onCustomMessage);
            context.stop();
        };
    }, []);
    return (
        <div className={styles['video-container']}>
            HI
        </div>
    );
};

module.exports = App;
