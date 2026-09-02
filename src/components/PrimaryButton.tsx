import React from 'react';
import { Button } from 'react-native-paper';
import { fonts, palette } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** 'solid' is the ink pill from the onboarding design. 'outline' is the quiet secondary. */
  variant?: 'solid' | 'outline';
  icon?: string;
  className?: string;
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'solid',
  icon,
  className = '',
}: Props) {
  const solid = variant === 'solid';
  return (
    <Button
      mode={solid ? 'contained' : 'outlined'}
      onPress={onPress}
      disabled={disabled || loading}
      loading={loading}
      icon={icon}
      // buttonColor / textColor / rippleColor reach Paper's internals, which no
      // class name can. The container itself is styled with className.
      buttonColor={solid ? palette.ink : 'transparent'}
      textColor={solid ? palette.white : palette.ink}
      rippleColor={solid ? 'rgba(255,255,255,0.18)' : 'rgba(19,19,22,0.08)'}
      className={`rounded-pill ${solid ? '' : 'border-thick border-outline-strong'} ${className}`}
      contentStyle={{ height: 58 }}
      labelStyle={{ fontFamily: fonts.ui, fontSize: 17, lineHeight: 22, letterSpacing: 0 }}
    >
      {label}
    </Button>
  );
}
