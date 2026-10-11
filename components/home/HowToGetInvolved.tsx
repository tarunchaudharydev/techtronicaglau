type Step = { title: string; description: string };

const HowToGetInvolved = ({ title, steps }: { title: string; steps: Step[] }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-sky-900">
        {title}
      </h2>
        <div className="relative border-l border-sky-200 pl-5 space-y-6">
        {steps.map((step, index) => (
          <div className="relative" key={`${step.title}-${index}`}>
            <span className={`absolute -left-1 top-1 h-3 w-3 rounded-full ${index % 3 === 0 ? "bg-sky-500" : index % 3 === 1 ? "bg-purple-500" : "bg-yellow-400"}`} />
            <h3 className="text-sm font-semibold text-sky-900">{index + 1}. {step.title}</h3>
            <p className="text-xs sm:text-sm text-slate-700">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowToGetInvolved;
