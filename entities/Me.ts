import type { SoundcloudUser } from "../types";
import { API } from "../API";

export class Me {
  public constructor(private readonly api: API) {}

  /**
   * Gets your own profile, using the Soundcloud v2 API.
   */
  public get = async () => {
    const response = await this.api.getV2("/me");
    return response as Promise<SoundcloudUser>;
  };

  public addLike = async (
    userId: string | number,
    trackId: string | number,
  ) => {
    const response = await this.api.put(
      `users/${userId}/track_likes/${trackId}`,
    );
    return response as Promise<string>;
  };

  public deleteLike = async (
    userId: string | number,
    trackId: string | number,
  ) => {
    const response = await this.api.delete(
      `users/${userId}/track_likes/${trackId}`,
    );
    return response as Promise<string>;
  };
}
