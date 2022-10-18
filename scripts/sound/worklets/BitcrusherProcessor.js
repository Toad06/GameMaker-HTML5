class BitcrusherProcessor extends AudioWorkletProcessor
{
    static get parameterDescriptors() 
    {
        return [
            { name: "bypass",     automationRate: "a-rate", defaultValue: 0,  minValue: 0, maxValue: 1 },
            { name: "gain",       automationRate: "a-rate", defaultValue: 1,  minValue: 0 },
            { name: "factor",     automationRate: "a-rate", defaultValue: 1,  minValue: 1, maxValue: 100 },
            { name: "resolution", automationRate: "a-rate", defaultValue: 16, minValue: 2, maxValue: 16  },
            { name: "mix",        automationRate: "a-rate", defaultValue: 0,  minValue: 0, maxValue: 1   },
        ];
    }

    static scalars = [
        undefined,
        undefined,
        2,
        4,
        8,
        16,
        32,
        64,
        128,
        256,
        512,
        1024,
        2048,
        4096,
        8192,
        16384,
        32768
    ];

    constructor()
    {
        super();
        this.sample = [];
        this.hold = 0;
    }

    process(inputs, outputs, parameters) 
    {
        const input = inputs[0];
        const output = outputs[0];

        const bypass = parameters.bypass;
        const gain = parameters.gain;
        const factor = parameters.factor;
        const resolution = parameters.resolution;
        const mix = parameters.mix;

        let h = this.hold;

        for (let c = 0; c < input.length; ++c) {
            const inputChannel = input[c];
            const outputChannel = output[c];

            h = this.hold;

            for (let s = 0; s < inputChannel.length; ++s) {
                // Copy the input to the output
                outputChannel[s] = inputChannel[s];

                // Update held sample
                if (h === 0)
                    this.sample[c] = inputChannel[s];

                // Update hold counter
                ++h;
                h %= (factor[s] ?? factor[0]);

                // Check bypass state
                if (bypass[s] ?? bypass[0])
                    continue;

                // Get the held sample
                let val = this.sample[c];

                // Apply gain and hard clip
                const g = (gain[s] ?? gain[0]);

                val *= g;
                val = Math.max(Math.min(val, 1.0), -1.0);

                // Resolution reduction
                const r = resolution[s] ?? resolution[0];
                const max = (val > 0.0) ? BitcrusherProcessor.scalars[r] - 1 : BitcrusherProcessor.scalars[r];

                val = Math.round(val * max) / max;

                // Mix the distorted sample and original samples
                const m = (mix[s] ?? mix[0]);

                outputChannel[s] *= (1.0 - m);
                outputChannel[s] += (val * m);
            }
        }

        this.hold = h;

        return true; // This should probably eventually be false
    }
}

registerProcessor("bitcrusher-processor", BitcrusherProcessor);
