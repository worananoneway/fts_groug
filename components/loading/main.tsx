export default function Loading() {
    return (
        <div className="flex justify-center xl:my-14">
            <div className="flex w-full max-w-[590px] flex-col-reverse gap-5 xl:w-auto xl:max-w-none xl:flex-row xl:gap-24">
                <div className="mb-28 px-5 text-center xl:mb-0 xl:w-[540px] xl:px-0">
                    <div className="h-[48px] w-full animate-pulse rounded-full bg-gray-200" />
                    <div className="mt-9 flex flex-col items-start gap-10">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div
                                className="flex w-full items-start gap-5"
                                key={idx}
                            >
                                <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-gray-200" />
                                <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-5 rounded-lg bg-white px-4 shadow-cardRegisterResume xl:mt-0 xl:w-[596px] xl:px-0">
                    <div className="flex flex-grow flex-col xl:px-[60px]">
                        <div className="box-border flex flex-col items-center gap-2 py-8 text-center xl:py-10">
                            <div className="h-8 w-[250px] animate-pulse rounded bg-gray-200" />
                            <div className="h-5 w-[200px] animate-pulse rounded bg-gray-200" />
                        </div>
                        <div className="mb-10 flex flex-col gap-5">
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="h-10 w-full animate-pulse rounded-lg bg-gray-200"
                                />
                            ))}
                        </div>
                        <div className="mb-10 h-11 w-full animate-pulse rounded-lg bg-gray-200" />
                    </div>
                </div>
            </div>
        </div>
    );
}