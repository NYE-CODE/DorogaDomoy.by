/** Реэкспорт FeatureFlags из корня проекта для корректного разрешения путей в landing. */
export {
  FeatureFlagsProvider,
  useFeatureFlags,
  type FeatureFlagsState,
} from '../../context/FeatureFlagsContext';
