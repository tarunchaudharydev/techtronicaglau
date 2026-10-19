type Step = { title: string; description: string };

const HowToGetInvolved = ({ title, steps }: { title: string; steps: Step[] }) => {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:p-9 lg:p-10">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => (
          <div
            className="flex gap-4 rounded-2xl border border-slate-200 bg-[#fbfcfd] p-5"
            key={`${step.title}-${index}`}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-sky-200 bg-sky-50 text-sm font-semibold text-sky-800">
              {index + 1}
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold leading-6 text-slate-900">
                {step.title}
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowToGetInvolved;
