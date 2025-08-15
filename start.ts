import SoundCloud from "./soundcloud"

require("dotenv").config()
const soundcloud = new SoundCloud();
(async () => {
    const result = await soundcloud.util.getTrackStreamUrl("https://soundcloud.com/5tereomanjpn/aire-tea-timestereoman-remix")
    console.log(result)
})()