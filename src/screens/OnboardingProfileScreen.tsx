import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { IconButton, Text, TouchableRipple } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ChoicePill, GlowBackground, PrimaryButton, TextLink } from '../components';
import { RootStackParamList } from '../navigation/types';
import { useOnboardingContext } from '../hooks/onboardingContext';
import { useUser } from '../hooks/userContext';
import {
  EXCLUSIVE_CONCERN,
  MAX_AGE,
  MIN_AGE,
  QuestionId,
  QUESTIONS,
  RECAP_LABEL,
  SkinProfile,
  labelFor,
} from '../data/onboardingQuestions';
import { fonts, palette } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingProfile'>;

/** Exit down, then the next question rises from below. ~440ms end to end. */
const OUT = 190;
const IN = 250;
/** How long a tapped pill stays lit before the card leaves. */
const CONFIRM = 190;
const OFFSET = 44;

const REVIEW = QUESTIONS.length;

export function OnboardingProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { complete } = useOnboardingContext();
  const { setProfile } = useUser();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<SkinProfile>({});
  const [age, setAge] = useState('');
  const [reduceMotion, setReduceMotion] = useState(false);

  // 1 = settled, 0 = parked below. Animating 1→0 drops the card out of frame;
  // 0→1 lifts the next one in. One value covers both halves of the transition.
  const card = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (cancelled) return;
        setReduceMotion(enabled);
        if (enabled) card.setValue(1);
        else {
          Animated.timing(card, {
            toValue: 1,
            duration: IN,
            delay: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }
      })
      .catch(() => card.setValue(1));
    return () => {
      cancelled = true;
    };
  }, [card]);

  const goTo = useCallback(
    (next: number) => {
      if (busy.current) return;
      if (reduceMotion) {
        setIndex(next);
        return;
      }
      busy.current = true;
      Animated.timing(card, {
        toValue: 0,
        duration: OUT,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIndex(next);
        Animated.timing(card, {
          toValue: 1,
          duration: IN,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          busy.current = false;
        });
      });
    },
    [card, reduceMotion],
  );

  /** Whatever is chosen for a question, always as a list. */
  const chosen = useCallback(
    (id: QuestionId): string[] => {
      const value = answers[id];
      if (Array.isArray(value)) return value;
      return value ? [value] : [];
    },
    [answers],
  );

  /** Single-select: record and move on. The tap is the answer. */
  const answerSingle = useCallback(
    (id: QuestionId, value: string) => {
      setAnswers((current) => ({ ...current, [id]: value }));
      // A beat so the selected pill is visibly lit before the card leaves.
      setTimeout(() => goTo(index + 1), reduceMotion ? 0 : CONFIRM);
    },
    [goTo, index, reduceMotion],
  );

  /** Multi-select: accumulate, and wait for Continue. */
  const toggleMulti = useCallback((id: QuestionId, value: string, max: number) => {
    setAnswers((current) => {
      const list = Array.isArray(current[id]) ? (current[id] as string[]) : [];

      if (list.includes(value)) {
        return { ...current, [id]: list.filter((v) => v !== value) };
      }
      // "I don't know" cannot sit next to a specific concern, in either direction.
      if (value === EXCLUSIVE_CONCERN) {
        return { ...current, [id]: [value] };
      }
      const withoutExclusive = list.filter((v) => v !== EXCLUSIVE_CONCERN);
      if (withoutExclusive.length >= max) return current;

      return { ...current, [id]: [...withoutExclusive, value] };
    });
  }, []);

  const ageValue = Number(age);
  const ageValid = /^\d+$/.test(age) && ageValue >= MIN_AGE && ageValue <= MAX_AGE;

  const submitAge = useCallback(() => {
    if (!ageValid) return;
    answerSingle('age', age);
  }, [age, ageValid, answerSingle]);

  const back = useCallback(() => {
    if (index === 0) navigation.goBack();
    else goTo(index - 1);
  }, [goTo, index, navigation]);

  const finish = useCallback(
    async (withAnswers: boolean) => {
      if (withAnswers) {
        // Wired to the backend later; for now it persists locally.
        console.log('[glownome] profile answers', answers);
        await setProfile(answers);
      }
      await complete();
      // Straight into the first scan, with the tab bar underneath so closing
      // the camera lands somewhere sensible rather than back in onboarding.
      navigation.reset({
        index: 1,
        routes: [{ name: 'Main' }, { name: 'ScanCapture' }],
      });
    },
    [answers, complete, navigation, setProfile],
  );

  const cardStyle = {
    opacity: card,
    transform: [
      { translateY: card.interpolate({ inputRange: [0, 1], outputRange: [OFFSET, 0] }) },
    ],
  };

  const question = index < REVIEW ? QUESTIONS[index] : null;

  return (
    <GlowBackground>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View className="px-gutter pt-sm">
            <IconButton
              icon="chevron-left"
              size={26}
              iconColor={palette.ink}
              onPress={back}
              accessibilityLabel="Back"
              style={{ marginLeft: -10 }}
            />
          </View>

          {/* Progress. Four short segments say "this is nearly over", which is
              what makes people finish. */}
          <View className="flex-row gap-xs px-gutter mt-sm">
            {QUESTIONS.map((q, i) => (
              <View
                key={q.id}
                className={`flex-1 h-[3px] rounded-pill ${
                  i < index ? 'bg-accent' : i === index ? 'bg-accent/40' : 'bg-outline'
                }`}
              />
            ))}
          </View>

          <View className="flex-1 justify-center px-gutter">
            <Animated.View style={cardStyle}>
              {question ? (
                <>
                  <Text className="font-ui text-caption text-accent">
                    {`QUESTION ${index + 1} OF ${QUESTIONS.length}`}
                  </Text>
                  <Text className="font-display text-title text-ink mt-sm">
                    {question.prompt}
                  </Text>
                  {question.hint ? (
                    <Text className="font-body text-body-sm text-ink-faint mt-xs">
                      {question.hint}
                    </Text>
                  ) : null}

                  {question.kind === 'choice' ? (
                    <ScrollView
                      className="mt-xl max-h-[230px]"
                      contentContainerClassName={
                        question.layout === 'wrap'
                          ? 'flex-row flex-wrap gap-sm pb-xs'
                          : 'gap-sm pb-xs'
                      }
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {question.options.map((option) => (
                        <ChoicePill
                          key={option.value}
                          label={option.label}
                          full={question.layout === 'stack'}
                          selected={chosen(question.id).includes(option.value)}
                          disabled={
                            question.multi
                              ? !chosen(question.id).includes(option.value) &&
                                option.value !== EXCLUSIVE_CONCERN &&
                                chosen(question.id).filter((v) => v !== EXCLUSIVE_CONCERN)
                                  .length >= (question.max ?? 99)
                              : false
                          }
                          onPress={() =>
                            question.multi
                              ? toggleMulti(question.id, option.value, question.max ?? 99)
                              : answerSingle(question.id, option.value)
                          }
                        />
                      ))}
                    </ScrollView>
                  ) : (
                    <View className="mt-2xl">
                      <TextInput
                        value={age}
                        onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                        onSubmitEditing={submitAge}
                        placeholder={question.placeholder}
                        placeholderTextColor={palette.inkFaint}
                        keyboardType="number-pad"
                        returnKeyType="done"
                        maxLength={2}
                        autoFocus
                        accessibilityLabel="Your age"
                        style={{
                          fontFamily: fonts.title,
                          fontSize: 28,
                          lineHeight: 34,
                          letterSpacing: -0.4,
                          color: palette.ink,
                          paddingVertical: 10,
                        }}
                      />
                      <View className="h-[1px] bg-outline-strong" />
                      {age && !ageValid ? (
                        <Text className="font-body text-body-sm text-rose mt-md">
                          {`Enter an age between ${MIN_AGE} and ${MAX_AGE}.`}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text className="font-ui text-caption text-accent">ALL DONE</Text>
                  <Text className="font-display text-title text-ink mt-sm">
                    That is everything
                  </Text>
                  <Text className="font-body text-body-sm text-ink-faint mt-xs">
                    Tap any line to change it.
                  </Text>

                  <View className="mt-xl">
                    {QUESTIONS.map((q, i) => (
                      <TouchableRipple
                        key={q.id}
                        onPress={() => goTo(i)}
                        rippleColor="rgba(19,19,22,0.06)"
                        accessibilityLabel={`Change ${RECAP_LABEL[q.id]}`}
                      >
                        <View className="flex-row items-center justify-between border-b-hairline border-outline py-md">
                          <Text className="font-body text-body-sm text-ink-faint">
                            {RECAP_LABEL[q.id]}
                          </Text>
                          <Text className="font-ui text-label text-ink">
                            {labelFor(q.id, answers[q.id])}
                          </Text>
                        </View>
                      </TouchableRipple>
                    ))}
                  </View>
                </>
              )}
            </Animated.View>
          </View>

          <View className="px-gutter" style={{ paddingBottom: insets.bottom + 20 }}>
            {/* Fixed-height slot: single-select steps have no button, and the
                skip link must not jump around as the wizard advances. */}
            <View className="h-[58px] justify-center">
              {index === REVIEW ? (
                <PrimaryButton label="Ready to scan" onPress={() => void finish(true)} />
              ) : question?.kind === 'number' ? (
                <PrimaryButton label="Next" onPress={submitAge} disabled={!ageValid} />
              ) : question?.kind === 'choice' && question.multi ? (
                <PrimaryButton
                  label={
                    chosen(question.id).length > 1
                      ? `Continue with ${chosen(question.id).length}`
                      : 'Continue'
                  }
                  onPress={() => goTo(index + 1)}
                  disabled={chosen(question.id).length === 0}
                />
              ) : null}
            </View>
            <View className="h-[44px] justify-center">
              <TextLink label="Skip for now" tone="muted" onPress={() => void finish(false)} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GlowBackground>
  );
}
