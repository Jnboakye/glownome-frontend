import { cssInterop } from 'nativewind';
import { Button, Card, Chip, Divider, List, Switch, Text, TouchableRipple } from 'react-native-paper';

/**
 * NativeWind understands `className` on React Native's own components. Third
 * party components have to be registered, which is what this does for the Paper
 * components the app uses.
 *
 * Note this only maps the OUTER container. Paper's internals — a Button's label
 * and ripple, a List.Item's title, a Switch's track — are still configured
 * through props and the theme, which is by design: they are not styleable from
 * the outside.
 *
 * Imported once, from App.tsx, before anything renders.
 */
const mapClassNameToStyle = { className: 'style' } as const;

cssInterop(Button, mapClassNameToStyle);
cssInterop(Card, mapClassNameToStyle);
cssInterop(Card.Content, mapClassNameToStyle);
cssInterop(Chip, mapClassNameToStyle);
cssInterop(Divider, mapClassNameToStyle);
cssInterop(List.Item, mapClassNameToStyle);
cssInterop(Switch, mapClassNameToStyle);
cssInterop(Text, mapClassNameToStyle);
cssInterop(TouchableRipple, mapClassNameToStyle);
