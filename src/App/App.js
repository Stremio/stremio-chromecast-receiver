const React = require('react');
const styles = require('./styles');

const CAST_NAMESPACE = 'urn:x-cast:com.stremio';

const App = () => {
    const context = React.useMemo(() => {
        return cast.framework.CastReceiverContext.getInstance();
    }, []);
    React.useEffect(() => {
        const onCustomMessage = (event) => {
            context.sendCustomMessage(CAST_NAMESPACE, undefined, event);
        };
        context.addCustomMessageListener(CAST_NAMESPACE, onCustomMessage);
        context.setLoggerLevel(process.env.DEBUG ? cast.framework.LoggerLevel.DEBUG : cast.framework.LoggerLevel.NONE);
        context.start();
        return () => {
            context.removeCustomMessageListener(CAST_NAMESPACE, onCustomMessage);
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
