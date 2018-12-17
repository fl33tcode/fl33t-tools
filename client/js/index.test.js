import fl33t  from "./index";
import tokens from "./tokens";


describe("fl33t test",()=>{
	it("Creates a fl33t object and check for updates",()=>{
		const fl33tObj = new fl33t(tokens.device,tokens.teamId);
		console.log(fl33tObj);
		let response = fl33tObj.checkin(tokens.deviceId);
		console.log(response);
	});
	

})