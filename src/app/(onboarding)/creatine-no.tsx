import { OnboardingScaffold, useOnboardingNav } from '../../features/onboarding';

export default function CreatineNoStep() {
  const { next } = useOnboardingNav('creatine-no', { record: false });
  return (
    <OnboardingScaffold
      step="creatine-no"
      title="No creatine, no problem"
      subtitle="Protein is the main event anyway. If you ever change your mind, it's one switch in Settings."
      cowLine="Suits me. I'm a grass purist."
      cowPose="shrug"
      cowSize={220}
      centered
      onContinue={() => next()}
    />
  );
}
