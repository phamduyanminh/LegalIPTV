const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

const services = [
    {
        name: "pluto",
        url: "https://github.com/iptv-org/iptv/blob/master/streams/ca_pluto.m3u",
        isM3U: true
    }
]

const M3U_HEADER = "#EXTM3U\n";

async function fetchChannels(service){
    try {
        const response = await axios.get(service.url);
        if (service.isM3U) {
          // Parse as plain M3U text
          const lines = response.data.split('\n');
          const channels = [];
    
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('#EXTINF')) {
              const nameMatch = lines[i].match(/,(.+)/);
              const logoMatch = lines[i].match(/tvg-logo="([^"]+)"/);
              const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
              const logo = logoMatch ? logoMatch[1] : '';
              const stream = lines[i + 1];
              channels.push({ name, logo, url: stream });
            }
          }
    
          return channels;
        } else {
          // Existing XML parser
          const parsed = await xml2js.parseStringPromise(response.data);
          const channels = parsed.tv.channel || [];
    
          return channels.map(ch => {
            const id = ch.$.id;
            const name = ch["display-name"]?.[0] || "Unknown";
            const logo = ch.icon?.[0]?.$.src || "";
            const url = service.streamTemplate.replace("{channelId}", id);
            return { name, logo, url };
          });
        }
    } catch (error) {
    console.error(`Failed to fetch/parse from ${service.url}:`, error.message);
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
  