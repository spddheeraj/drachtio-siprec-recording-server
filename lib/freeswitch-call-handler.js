const payloadParser = require('./payload-parser');
const payloadCombiner = require('./payload-combiner');
const Mrf = require('drachtio-fsmrf');
const config = require('config');

module.exports = handler;

async function connectMS(srf) {
  const mrf = new Mrf(srf);
  return await mrf.connect(config.get('freeswitch'));
}

function handler(logger) {
  let ms;

  return async function handler(req, res) {
    let callid = req.get('Call-ID');
    const logger = req.srf.locals.logger.child({callid});
    const srf = req.srf;
    const wsUrl = req.srf.locals.wsUrl;
    logger.info(`received incoming SIPREC invite to ${req.uri}`);
    console.log("req.srf", req.srf);

    try {
      ms = ms || await connectMS(req.srf);
    } catch (err) {
      logger.error(err, 'Error connecting to freeswitch');
      return res.send(480);
    }

    try {
      const opts = await payloadParser({req});
      const ep1 = await ms.createEndpoint({remoteSdp: opts.sdp1});
      const ep2 = await ms.createEndpoint({remoteSdp: opts.sdp2});
      await ep2.bridge(ep1);
    

      if(req.get('X-Avaamo-Acct') && opts.recordingData.recording.session && Array.isArray(opts.recordingData.recording.session) && opts.recordingData.recording.session[0].sipSessionID && opts.recordingData.recording.session[0].sipSessionID[0]){
        callid = opts.recordingData.recording.session[0].sipSessionID[0];
	callid = callid.replace(/;remote.*/gi, "");
    }
      console.log("callid", callid);
      if (config.has('wsUrl')) {
        const metadata = {
          event: 'start',
          sequenceNumber: '1',
          start: {
            accountSid: req.get('X-Avaamo-Acct') || req.get('X-Twilio-AccountSid') || req.get('X-Avaamo-Acct'),
            streamSid: callid,
            callSid: callid,
            tracks: [ 'inbound', 'outbound' ],
            mediaFormat: { encoding: 'audio/raw', sampleRate: 8000, channels: 2 },
            customParameters: {mode: "siprec"}
          },
          streamSid: callid
        }
        try{
	  console.log("recording session", opts.recordingData.recording.session[0].sipSessionID[0]);
          opts.recordingData.recording.session[0].ExtensionParameters[0].Parameter.forEach((param) => {
            metadata.start.customParameters[param.$.name] = param.$.value;
          })
        }
        catch(e){
        }
        logger.info(metadata);
        const result = await ep1.forkAudioStart({
          mixType: 'stereo',
          sampling: '8000',
          wsUrl: config.get('wsUrl'),
          metadata
        });
        logger.info(`result from calling mod_audio_fork: ${JSON.stringify(result)}`);
      }
      console.log("ep1.local.sdp", ep1.local.sdp);
      console.log("ep2.local.sdp", ep2.local.sdp);
      const localSdp = payloadCombiner(ep1.local.sdp, ep2.local.sdp);
      const dlg = await srf.createUAS(req, res, {localSdp});
      logger.info('successfully answered call');
      dlg.on('destroy', () => {
        logger.info('call ended');
        ep1.destroy();
        ep2.destroy();
      });
    } catch (err) {
      logger.error(err, 'Error establishing call');
    }
  };
}
