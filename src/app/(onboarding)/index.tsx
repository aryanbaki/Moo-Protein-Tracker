import { AppText, Button, Screen } from '../../components';
import { Cow } from '../../mascot';
import { useProfile } from '../../state/profile';

export default function Welcome() {
  const complete = useProfile((s) => s.completeOnboarding);
  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center' }} footer={<Button title="Get started" onPress={complete} />}>
      <Cow pose="wave" />
      <AppText variant="title" center>Track your protein.{'\n'}Fill the cow.</AppText>
    </Screen>
  );
}
