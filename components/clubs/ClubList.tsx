import { FlatList } from 'react-native';

import type { ClubWithDistance } from '@/lib/queries';

import { ClubListItem } from './ClubListItem';

type Props = {
  clubs: ClubWithDistance[];
};

export function ClubList({ clubs }: Props) {
  return (
    <FlatList
      data={clubs}
      keyExtractor={(c) => c.id}
      renderItem={({ item }) => <ClubListItem club={item} />}
    />
  );
}
