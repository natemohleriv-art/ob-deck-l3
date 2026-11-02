import { create } from "zustand";
import { VideoTexture, SRGBColorSpace, LinearFilter } from "three";
export type Media = {
  id: string;
  name: string;
  url: string;
  video: HTMLVideoElement;
  texture: VideoTexture;
  width: number;
  height: number;
  duration: number;
  status: string;
  error?: string;
};
type MediaState = {
  items: Record<string, Media>;
  playing: boolean;
  time: number;
  duration: number;
  loop: boolean;
  muted: boolean;
  rate: number;
  active: string[];
  error: string;
  load: (id: string, file: File) => void;
  remove: (id: string) => void;
  setActive: (ids: string[]) => void;
  play: () => Promise<void>;
  pause: () => void;
  seek: (t: number) => void;
  options: (o: Partial<Pick<MediaState, "loop" | "muted" | "rate">>) => void;
};
function dispose(m: Media) {
  m.video.pause();
  m.video.removeAttribute("src");
  m.video.load();
  m.texture.dispose();
  URL.revokeObjectURL(m.url);
}
export const useMedia = create<MediaState>((set, get) => ({
  items: {},
  playing: false,
  time: 0,
  duration: 0,
  loop: true,
  muted: true,
  rate: 1,
  active: ["floor", "ceiling", "wall"],
  error: "",
  load: (id, file) => {
    if (!/\.(mp4|m4v|webm)$/i.test(file.name)) {
      set({ error: "Choose a browser-compatible MP4 (H.264 preferred)." });
      return;
    }
    get().remove(id);
    const url = URL.createObjectURL(file),
      video = document.createElement("video");
    video.playsInline = true;
    video.preload = "auto";
    video.muted = get().muted;
    video.playbackRate = get().rate;
    const texture = new VideoTexture(video);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    const item: Media = {
      id,
      name: file.name,
      url,
      video,
      texture,
      width: 0,
      height: 0,
      duration: 0,
      status: "Loading…",
    };
    set((s) => ({ items: { ...s.items, [id]: item }, error: "" }));
    const update = (patch: Partial<Media>) => {
      if (get().items[id]?.video === video)
        set((s) => ({
          items: { ...s.items, [id]: { ...s.items[id], ...patch } },
        }));
    };
    video.onloadedmetadata = () => {
      update({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        status: "Ready",
      });
      get().setActive(get().active);
      video.currentTime = localTime(get().time, video.duration, get().loop);
      if (get().playing && get().active.includes(id))
        void video
          .play()
          .catch(() => update({ status: "Click Play to start" }));
    };
    video.onplaying = () => update({ status: "Playing" });
    video.onpause = () => update({ status: "Paused" });
    video.onwaiting = () => update({ status: "Buffering" });
    video.onerror = () => {
      update({
        status: "Cannot decode",
        error: "Unsupported or damaged media. Try H.264 MP4.",
      });
      set({ error: `Cannot decode ${file.name}. Try H.264 MP4.` });
    };
    video.src = url;
    video.load();
  },
  remove: (id) => {
    const old = get().items[id];
    if (old) dispose(old);
    set((s) => {
      const items = { ...s.items };
      delete items[id];
      return { items };
    });
    get().setActive(get().active);
  },
  setActive: (active) => {
    const s = get();
    for (const [id, m] of Object.entries(s.items))
      if (!active.includes(id)) m.video.pause();
    const duration = Math.max(
      0,
      ...active.map((id) => s.items[id]?.duration || 0),
    );
    set({
      active,
      duration,
      time: Math.min(s.time, duration),
      playing: duration > 0 && s.playing,
    });
  },
  play: async () => {
    const s = get();
    const videos = s.active
      .map((id) => s.items[id])
      .filter((m) => m && m.duration > 0);
    if (!videos.length) return;
    set({ error: "" });
    const results = await Promise.allSettled(
      videos.map((m) => {
        m.video.currentTime = localTime(s.time, m.duration, s.loop);
        return m.video.play();
      }),
    );
    const failed = results.some((r) => r.status === "rejected");
    if (failed) {
      videos.forEach((m) => m.video.pause());
      set({
        playing: false,
        error:
          "Playback could not start. Check the media codec, then click Play again.",
      });
    } else set({ playing: true });
  },
  pause: () => {
    Object.values(get().items).forEach((m) => m.video.pause());
    set({ playing: false });
  },
  seek: (time) => {
    const s = get();
    time = Math.max(0, Math.min(s.duration, time));
    for (const id of s.active) {
      const m = s.items[id];
      if (m?.duration)
        m.video.currentTime = localTime(time, m.duration, s.loop);
    }
    set({ time });
  },
  options: (o) => {
    set(o);
    const s = get();
    Object.values(s.items).forEach((m) => {
      m.video.muted = s.muted;
      m.video.playbackRate = s.rate;
    });
  },
}));
export function localTime(t: number, duration: number, loop: boolean) {
  if (!duration) return 0;
  return loop ? t % duration : Math.min(t, Math.max(0, duration - 0.001));
}
// A monotonic master clock; periodic correction, not a frame-accuracy guarantee.
let last = performance.now();
setInterval(() => {
  const now = performance.now(),
    dt = Math.min((now - last) / 1000, 0.5);
  last = now;
  const s = useMedia.getState();
  if (!s.playing) return;
  let time = s.time + dt * s.rate;
  if (time >= s.duration) {
    if (s.loop) time %= s.duration || 1;
    else {
      useMedia.setState({ time: s.duration });
      s.pause();
      return;
    }
  }
  for (const id of s.active) {
    const m = s.items[id];
    if (!m?.duration) continue;
    const target = localTime(time, m.duration, s.loop);
    if (Math.abs(m.video.currentTime - target) > 0.12 && !m.video.seeking)
      m.video.currentTime = target;
    if (m.video.paused && (s.loop || time < m.duration))
      void m.video.play().catch(() => {});
  }
  useMedia.setState({ time });
}, 100);
