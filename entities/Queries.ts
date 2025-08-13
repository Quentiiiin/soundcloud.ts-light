import { API } from "../API"
import { SoundcloudQuery } from "../types/QueryTypes"

export class Queries {
    public constructor(private readonly api: API) { }

    /**
     * Completes a query using the Soundcloud API
     */
    public complete = async (query: string) => {
        const response = await this.api.getV2('/search/queries', { q: query })
        return response as Promise<SoundcloudQuery>
    }
}
