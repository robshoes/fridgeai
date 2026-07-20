import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type Props = {
  icon: string;
  color?: string;
  size?: number;
};

export function CategoryIcon({ icon, color = '#2e7d32', size = 20 }: Props) {
  return (
    <Ionicons name={icon as ComponentProps<typeof Ionicons>['name']} color={color} size={size} />
  );
}
