import { AppText } from '../../components';
import { formatTime12, shiftTime, syncReminders } from '../../features/reminders';
import { Group, Note, SettingsScreen, Stepper, ToggleRow } from '../../features/settings/ui';
import { useProfile } from '../../state/profile';
import type { CreatineSettings } from '../../types';

const MIN_DOSE = 1;
const MAX_DOSE = 10;
const DEFAULT_TIME = '09:00';

export default function CreatineSettingsScreen() {
  const creatine = useProfile((s) => s.creatine);

  const update = (patch: Partial<CreatineSettings>) => {
    useProfile.getState().setCreatine(patch);
    void syncReminders();
  };
  const dose = Math.min(MAX_DOSE, Math.max(MIN_DOSE, Math.round(creatine.doseG)));
  const time = creatine.reminderTime;

  return (
    <SettingsScreen title="Creatine">
      <Group>
        <ToggleRow label="Track creatine" sublabel="Adds a daily check-off to Home" value={creatine.enabled} onChange={(enabled) => update({ enabled })} />
      </Group>

      {creatine.enabled ? (
        <>
          <Group title="Daily amount">
            <Stepper
              label="Dose"
              valueText={`${dose} g`}
              decLabel="Decrease dose by 1 gram"
              incLabel="Increase dose by 1 gram"
              onDec={() => update({ doseG: Math.max(MIN_DOSE, dose - 1) })}
              onInc={() => update({ doseG: Math.min(MAX_DOSE, dose + 1) })}
            />
          </Group>

          <Group title="Reminder" footer={time ? `Moo will nudge you every day at ${formatTime12(time)}, if notifications are allowed.` : 'No reminder. You can still check it off on Home.'}>
            <ToggleRow label="Daily reminder" value={!!time} onChange={(on) => update({ reminderTime: on ? DEFAULT_TIME : null })} />
            {time ? (
              <Stepper label="Hour" valueText={formatTime12(time)} decLabel="One hour earlier" incLabel="One hour later" onDec={() => update({ reminderTime: shiftTime(time, -60) })} onInc={() => update({ reminderTime: shiftTime(time, 60) })} />
            ) : null}
            {time ? (
              <Stepper label="Minutes" valueText={`:${time.slice(3)}`} decLabel="Five minutes earlier" incLabel="Five minutes later" onDec={() => update({ reminderTime: shiftTime(time, -5) })} onInc={() => update({ reminderTime: shiftTime(time, 5) })} />
            ) : null}
          </Group>
        </>
      ) : (
        <AppText variant="caption" center>No creatine, no problem. The cow doesn&apos;t judge.</AppText>
      )}

      <Note>
        <AppText variant="label">Good to know</AppText>
        <AppText variant="caption">3–5 g a day is the commonly studied dose of creatine monohydrate. Moo only helps you remember it; it doesn&apos;t tell you what to take.</AppText>
        <AppText variant="caption">Not medical advice. If you have a health condition or take medication, check with a doctor first.</AppText>
      </Note>
    </SettingsScreen>
  );
}
