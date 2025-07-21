import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  iteration: Annotation<number>({
    default: () => 0,
    reducer: (_, update) => update,
  }),
});

export type State = typeof StateAnnotation.State;
    