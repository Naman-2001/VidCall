const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
});

const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    peers[userId].close();
  }
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

socket.on("user-connected", (userId) => {
  console.log("user Connected:" + userId);
});

socket.on("message", (mes) => {
  console.log(mes.message + " : " + mes.name);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

function pauseVideo() {
  const video = document.querySelector("video");
  const stream = video.srcObject;
  const tracks = stream.getVideoTracks();
  tracks.forEach((track) => {
    track.enabled = !track.enabled;
  });
}

function muteAudio() {
  const video = document.querySelector("video");
  const stream = video.srcObject;
  const tracks = stream.getAudioTracks();
  tracks.forEach((track) => {
    track.enabled = !track.enabled;
  });
}

const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  console.log(message);
  socket.emit("chat-message", message);
  messageInput.value = "";
});
