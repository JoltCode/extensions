import { useState } from "react";

import { Color, Grid, Icon } from "@raycast/api";

import {
  ServiceName,
  getMaxResults,
  getServiceTitle,
  getGridItemSize,
  getGridTrendingItemSize,
  GIF_SERVICE,
  GRID_COLUMNS,
} from "../preferences";

import useSearchAPI from "../hooks/useSearchAPI";
import useSavedGifs from "../hooks/useSavedGifs";

import { GifGridSection } from "./GifGridSection";

export function GifSearch() {
  const limit = getMaxResults();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchService, setSearchService] = useState<ServiceName>();

  const { data: results, isLoading, pagination } = useSearchAPI({ term: searchTerm, service: searchService, limit });
  const { recentGifs, favoriteGifs, allGifs, isLoading: isLoadingLocalGifs, mutate } = useSavedGifs(searchService);

  const itemSize = searchTerm.length > 0 ? getGridItemSize() : getGridTrendingItemSize();

  const onServiceChange = (service: string) => {
    setSearchService(service as ServiceName);
    setSearchTerm(searchTerm);
  };

  const showAllFavs = searchService === GIF_SERVICE.FAVORITES;
  const showAllRecents = searchService === GIF_SERVICE.RECENTS;

  let placeholder = `Search for GIFs${searchService ? ` on ${getServiceTitle(searchService)}` : ""}`;
  if (showAllFavs) {
    placeholder = "Search recents";
  }
  if (showAllRecents) {
    placeholder = "Search favorites";
  }

  let emptyState = { text: "Enter a search above to get started…", icon: Icon.MagnifyingGlass };
  if (showAllFavs) {
    emptyState = { text: "Add some GIFs to your Favorites first…", icon: Icon.Clock };
  }
  if (showAllRecents) {
    emptyState = { text: "Work with some GIFs first…", icon: Icon.Clock };
  }

  let sections = [
    ...(searchTerm.length === 0
      ? [
          { title: "Favorites", results: favoriteGifs, isLocalGifSection: true },
          { title: "Recent", results: recentGifs, isLocalGifSection: true },
        ]
      : []),
    { title: "Trending", results },
  ];

  if (showAllFavs || showAllRecents) {
    sections =
      allGifs?.map(([service, gifs]) => {
        return { title: getServiceTitle(service), results: gifs, isLocalGifSection: true };
      }) ?? [];
  }

  const columns = GRID_COLUMNS[itemSize];

  return (
    <Grid
      columns={columns}
      pagination={pagination}
      searchBarAccessory={
        <Grid.Dropdown tooltip="Change GIF Provider" storeValue={true} onChange={onServiceChange}>
          <Grid.Dropdown.Section>
            <Grid.Dropdown.Item
              title="Giphy GIFs"
              value={GIF_SERVICE.GIPHY}
              icon={{ source: "giphy-logo-square-180.png" }}
            />
            <Grid.Dropdown.Item
              title="Giphy Clips"
              value={GIF_SERVICE.GIPHY_CLIPS}
              icon={{ source: "giphy-logo-square-180.png" }}
            />
            <Grid.Dropdown.Item
              title="Tenor"
              value={GIF_SERVICE.TENOR}
              icon={{ source: "tenor-logo-square-180.png" }}
            />
            <Grid.Dropdown.Item
              title="Finer Gifs Club"
              value={GIF_SERVICE.FINER_GIFS}
              icon={{ source: "finergifs-logo.svg", tintColor: Color.PrimaryText }}
            />
          </Grid.Dropdown.Section>
          <Grid.Dropdown.Section>
            <Grid.Dropdown.Item
              title="Favorites"
              value={GIF_SERVICE.FAVORITES}
              icon={{ source: Icon.Star, tintColor: Color.Yellow }}
            />
            <Grid.Dropdown.Item title="Recent" value={GIF_SERVICE.RECENTS} icon={{ source: Icon.Clock }} />
          </Grid.Dropdown.Section>
        </Grid.Dropdown>
      }
      filtering={showAllFavs || showAllRecents}
      isLoading={isLoading || isLoadingLocalGifs}
      throttle
      searchBarPlaceholder={placeholder}
      onSearchTextChange={setSearchTerm}
    >
      <Grid.EmptyView title={emptyState.text} icon={emptyState.icon} />
      {sections.map((section) => (
        <GifGridSection
          key={section.title}
          title={section.title}
          results={section.results ?? []}
          term={searchTerm}
          service={searchService}
          isLocalGifSection={section.isLocalGifSection}
          mutate={mutate}
        />
      ))}
    </Grid>
  );
}
