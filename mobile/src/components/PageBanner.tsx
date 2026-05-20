/**
 * PageBanner — mobile counterpart to the web myDHLi yellow page header.
 *
 * Sits at the top of each tab screen, mirroring the visual rhythm of the
 * desktop dashboard (Word image11/12 reference). Yellow background, a small
 * white circle with the page icon on the left, the page title beside it.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  title: string;
  icon: IoniconName;
  right?: React.ReactNode;
  testID?: string;
}

export default function PageBanner({ title, icon, right, testID }: Props) {
  return (
    <View testID={testID || 'page-banner'} style={styles.bar}>
      <View style={styles.left}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={16} color={Colors.dhlInk} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.dhlYellow,
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.dhlYellowDark,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dhlInk,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  right: { marginLeft: 12 },
});
