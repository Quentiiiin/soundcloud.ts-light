export interface SoundcloudQueryEntry {
    output: string,
    query: string
}

export interface SoundcloudQuery {
    collection: SoundcloudQueryEntry[],
    query_urn: string
}