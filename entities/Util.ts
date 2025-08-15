import type { SoundcloudTrack, SoundcloudTranscoding } from "../types"
import { API } from "../API"
import { Tracks, Users, Playlists } from "./index"

export class Util {
    private readonly tracks = new Tracks(this.api)
    private readonly users = new Users(this.api)
    private readonly playlists = new Playlists(this.api)

    public constructor(private readonly api: API) { }

    private readonly resolveTrack = async (
        trackResolvable: string | SoundcloudTrack
    ) => {
        return typeof trackResolvable === "string"
            ? await this.tracks.get(trackResolvable)
            : trackResolvable
    }

    private readonly sortTranscodings = async (
        trackResolvable: string | SoundcloudTrack,
        protocol?: "progressive" | "hls"
    ) => {
        const track = await this.resolveTrack(trackResolvable)
        const transcodings = track.media.transcodings.sort(t =>
            t.quality === "hq" ? -1 : 1
        )
        if (!protocol) return transcodings
        return transcodings.filter(t => t.format.protocol === protocol)
    }

    private readonly getStreamLink = async (transcoding: SoundcloudTranscoding) => {
        if (!transcoding?.url) return null
        const url = transcoding.url
        let client_id = await this.api.getClientId()
        const headers = this.api.headers
        let connect = url.includes("?")
            ? `&client_id=${client_id}`
            : `?client_id=${client_id}`

        try {
            return await fetch(url + connect, { headers })
                .then(r => r.json())
                .then(r => r.url)
        } catch {
            client_id = await this.api.getClientId(true)
            connect = url.includes("?")
                ? `&client_id=${client_id}`
                : `?client_id=${client_id}`
            try {
                return await fetch(url + connect, { headers })
                    .then(r => r.json())
                    .then(r => r.url)
            } catch {
                return null
            }
        }
    }

    /**
     * Gets the direct streaming link of a track.
     */
    public streamLink = async (
        trackResolvable: string | SoundcloudTrack,
        protocol?: "progressive" | "hls"
    ) => {
        const track = await this.resolveTrack(trackResolvable)
        const transcodings = await this.sortTranscodings(track, protocol)
        if (!transcodings.length) return null
        return this.getStreamLink(transcodings[0])
    }

    /**
     * Gets the best quality streaming URL for React Native audio players.
     */
    public getTrackStreamUrl = async (
        trackResolvable: string | SoundcloudTrack
    ) => {
        // Try progressive first (direct MP3/M4A URL)
        let url = await this.streamLink(trackResolvable, "progressive")
        if (url) return { url, type: "progressive" }

        // Fall back to HLS if progressive not available
        url = await this.streamLink(trackResolvable, "hls")
        if (url) return { url, type: "hls" }

        return null
    }

    /**
     * Gets track info with streaming URL.
     */
    public getTrackForPlayback = async (trackResolvable: string | SoundcloudTrack) => {
        const track = await this.resolveTrack(trackResolvable)
        const streamData = await this.getTrackStreamUrl(track)

        return {
            track,
            streamUrl: streamData?.url || null,
            streamType: streamData?.type || null,
        }
    }

    /**
     * Gets the song cover URL (no download, just URL).
     */
    public getSongCoverUrl = async (trackResolvable: string | SoundcloudTrack) => {
        const track = await this.resolveTrack(trackResolvable)
        const artwork = (track.artwork_url ? track.artwork_url : track.user.avatar_url)
            .replace(".jpg", ".png")
            .replace("-large", "-t500x500")

        const client_id = await this.api.getClientId()
        return `${artwork}?client_id=${client_id}`
    }

    /**
     * Gets playlist tracks with streaming info.
     */
    public getPlaylistForPlayback = async (playlistResolvable: string, limit?: number) => {
        const playlist = await this.playlists.get(playlistResolvable)
        const tracksToProcess = limit ? playlist.tracks.slice(0, limit) : playlist.tracks

        const tracksWithStreams = await Promise.allSettled(
            tracksToProcess.map(track => this.getTrackForPlayback(track))
        )

        return {
            playlist,
            tracks: tracksWithStreams
                .filter((result): result is PromiseFulfilledResult<any> =>
                    result.status === 'fulfilled' && result.value.streamUrl !== null
                )
                .map(result => result.value)
        }
    }

    /**
     * Gets user likes with streaming info.
     */
    public getLikesForPlayback = async (
        userResolvable: string | number,
        limit?: number
    ) => {
        const tracks = await this.users.likes(userResolvable, limit)
        const tracksWithStreams = await Promise.allSettled(
            tracks.map(track => this.getTrackForPlayback(track))
        )

        return tracksWithStreams
            .filter((result): result is PromiseFulfilledResult<any> =>
                result.status === 'fulfilled' && result.value.streamUrl !== null
            )
            .map(result => result.value)
    }
}