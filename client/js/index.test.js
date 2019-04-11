import fl33t  from "./index";
import config from "./config";

describe("checkin test",()=>{
    it("Creates a fl33t object and check for updates", ()=>{
        const fl33tObj = new fl33t(config.sessionToken, config.teamId);
        return fl33tObj.checkin(config.deviceId);
    });
});

describe("get trains test",()=>{
    it("Creates a fl33t object and fetches build trains", ()=>{
        const fl33tObj = new fl33t(config.sessionToken, config.teamId);
        return fl33tObj.getTrains();
    });
});

describe("get builds test",()=>{
    it("Creates a fl33t object and fetches 5 builds from one train", ()=>{
        const fl33tObj = new fl33t(config.sessionToken, config.teamId);
        return fl33tObj.getTrains().then(resp => {
            return fl33tObj.getBuilds(resp.trains[0].train_id, {limit: 5});
        });
    });
});
