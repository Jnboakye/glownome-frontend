import React from 'react';
import { View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { TextLink } from './TextLink';

type Props = {
  onStartRoutine: () => void;
  onTrackProgress: () => void;
  onSave?: () => void;
  saveLabel?: string;
};

export function NextSteps({ onStartRoutine, onTrackProgress, onSave, saveLabel }: Props) {
  return (
    <View>
      <PrimaryButton label="Start your routine" onPress={onStartRoutine} className="mb-md" />
      <PrimaryButton
        label="Track progress"
        variant="outline"
        onPress={onTrackProgress}
      />
      {onSave ? (
        <View className="h-[44px] justify-center">
          <TextLink label={saveLabel ?? 'Save this analysis'} tone="muted" onPress={onSave} />
        </View>
      ) : null}
    </View>
  );
}
