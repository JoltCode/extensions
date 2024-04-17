import { useCachedPromise } from "@raycast/utils";
import { LocalType, get, getAll } from "../lib/localGifs";
import { ServiceName } from "../preferences";
import { getAPIByServiceName } from "./useSearchAPI";

async function getSavedGifs(type: LocalType, service?: ServiceName) {
  if (!service) return [];

  const recent = await get(service, type);
  const ids = Array.from(recent);

  const api = await getAPIByServiceName(service);
  if (api === null) return [];

  const gifs = await api.gifs(ids);
  return gifs.results;
}

export default function useSavedGifs(service?: ServiceName) {
  const isAllFavsOrRecents = service === "favorites" || service === "recents";

  const {
    data: recentGifs,
    isLoading: isLoadingRecentGifs,
    mutate: mutateRecentGifs,
  } = useCachedPromise((service) => getSavedGifs("recent", service), [service], {
    execute: !isAllFavsOrRecents,
  });

  const {
    data: favoriteGifs,
    isLoading: isLoadingFavoriteGifs,
    mutate: mutateFavoriteGifs,
  } = useCachedPromise((service) => getSavedGifs("favs", service), [service], {
    execute: !isAllFavsOrRecents,
  });

  // TODO: Implement onError
  const {
    data: allGifs,
    isLoading: isLoadingAllGifs,
    mutate: mutateAllGifs,
  } = useCachedPromise(
    async (service?: ServiceName) => {
      let type: LocalType;
      if (service === "favorites") type = "favs";
      else if (service === "recents") type = "recent";
      else return [];

      const all = await getAll(type);
      // Populate all gifs using the API
      const promises = all.map(async ([service, ids]) => {
        const api = await getAPIByServiceName(service);
        if (api === null) return [];
        const gifs = await api.gifs(ids);
        return [service, gifs.results] as const;
      });

      const results = await Promise.all(promises);
      return results;
    },
    [service],
    { execute: isAllFavsOrRecents },
  );

  // TODO: Add different addTo, isIn, etc. methods for favorites and recents
  async function mutate() {
    if (service === "favorites" || service === "recents") {
      return mutateAllGifs();
    }
    mutateRecentGifs();
    mutateFavoriteGifs();
  }

  return {
    recentGifs,
    favoriteGifs,
    allGifs,
    isLoading: isLoadingRecentGifs || isLoadingFavoriteGifs || isLoadingAllGifs,
    mutate,
  };
}
