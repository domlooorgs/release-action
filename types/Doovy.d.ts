/**
 * Copyright 2026 SoTeen Studio
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
export declare const CATEGORIES: readonly ["FEATURES", "BUG_FIXES", "MAINTENANCE"];
type Category = typeof CATEGORIES[number];
export declare class CommitClassifier {
    private vocabulary;
    private weightsInputHidden;
    private weightsHiddenOutput;
    private biasHidden;
    private biasOutput;
    private hiddenSize;
    private learningRate;
    constructor();
    private tokenize;
    private buildVocabulary;
    private textToVector;
    private sigmoid;
    private sigmoidDerivative;
    private initWeights;
    train(data: {
        text: string;
        category: Category;
    }[], epochs?: number): void;
    classify(text: string): Category;
    generateChangelog(commits: string[]): string;
}
export {};
