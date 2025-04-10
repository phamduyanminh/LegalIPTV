const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

const services = [
    {
        name: "pluto",
        url: "https://i.mjh.nz/PlutoTV/ca.xml",
        streamTemplate: "https://pluto.tv/ca/live-tv/{channelId}"
    }
]

const M3U_HEADER = "#EXTM3U\n";

async function fetchChannels(service){
    try{
        const response = await axios.get(service.url);
        const parsed = await xml2js.parseStringPromise(response.data);
        const channels = parsed.tv.channel || [];

        const playlist = channels.map(ch => {
            const id = ch.$.id;
            const name = ch["display-name"]?.[0] || "Unknown";
            const logo = ch.icon?.[0]?.$.src || "";
            const url = service.streamTemplate.replace("{channelId}", id);
            return { name, logo, url };
        });
    
        return playlist;
    }catch(error){
        console.log(`Failed to fetch data from ${url}: `, error.message);
        return [];
    }
}

function generateM3U(channels) {
    let m3u = M3U_HEADER;
    channels.forEach(channel => {
      if (channel.url) {
        const name = channel.name || "Unknown";
        const logo = channel.logo || "";
        const stream = channel.url;
        m3u += `#EXTINF:-1 tvg-logo=\"${logo}\",${name}\n${stream}\n`;
      }
    });
    return m3u;
}
  
async function main() {
    for (const service of services) {
        console.log(`Fetching ${service.name}...`);
        const channels = await fetchChannels(service);
        const m3uContent = generateM3U(channels);
        const filename = `${service.name}.m3u`;
        fs.writeFileSync(filename, m3uContent, "utf8");
        console.log(`✅ ${filename} written`);
    }
}

main();
  