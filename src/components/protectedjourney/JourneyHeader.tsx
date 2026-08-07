interface JourneyHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
}

export default function JourneyHeader({
  currentStep,
  totalSteps,
  title,
  subtitle,
}: JourneyHeaderProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">

      <p className="text-sm font-medium text-[#4ADE80]">
        Step {currentStep} of {totalSteps}
      </p>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#223534]">
        <div
          className="h-full rounded-full bg-[#4ADE80] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h1 className="mt-6 text-3xl font-black text-[#F5F3EF]">
        {title}
      </h1>

      <p className="mt-2 text-[#7BA3A1]">
        {subtitle}
      </p>

    </div>
  );
}