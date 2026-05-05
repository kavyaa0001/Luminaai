import { YoutubeTranscript } from "youtube-transcript";

async function test() {
  try {
    const videoId = "YRnjGeQbsHQ";
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    console.log("Item count:", transcript.length);
    console.log("First 5 items:", transcript.slice(0, 5));
    console.log("Last 5 items:", transcript.slice(-5));
  } catch (e) {
    console.error(e);
  }
}

test();
