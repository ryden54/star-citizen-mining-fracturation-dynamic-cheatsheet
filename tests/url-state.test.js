import { describe, it, expect, beforeEach } from 'vitest';
import { serializeConfig, deserializeConfig, urlState } from '../public/js/app.js';

describe('URL State Management', () => {
    describe('serializeConfig', () => {
        it('should serialize a simple configuration', () => {
            const ships = [{
                type: 'prospector',
                lasers: [{
                    laserType: 'arbor',
                    modules: ['none', 'none', 'none']
                }]
            }];
            const gadgets = [];

            const result = serializeConfig(ships, gadgets);

            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        it('should serialize configuration with gadgets', () => {
            const ships = [{
                type: 'prospector',
                lasers: [{
                    laserType: 'arbor',
                    modules: ['rieger', 'none', 'none']
                }]
            }];
            const gadgets = ['sabir', 'optimax'];

            const result = serializeConfig(ships, gadgets);

            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
        });

        it('should serialize multiple ships', () => {
            const ships = [
                {
                    type: 'prospector',
                    lasers: [{
                        laserType: 'arbor',
                        modules: ['none', 'none', 'none']
                    }]
                },
                {
                    type: 'prospector',
                    lasers: [{
                        laserType: 'helix',
                        modules: ['rieger', 'rieger', 'rieger']
                    }]
                }
            ];
            const gadgets = ['sabir'];

            const result = serializeConfig(ships, gadgets);

            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
        });

        it('should serialize Golem with fixed laser', () => {
            const ships = [{
                type: 'golem',
                lasers: [{
                    laserType: 'pitman',
                    modules: ['none', 'none']
                }]
            }];
            const gadgets = [];

            const result = serializeConfig(ships, gadgets);

            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
        });
    });

    describe('deserializeConfig', () => {
        it('should deserialize a serialized configuration', () => {
            const original = {
                ships: [{
                    type: 'prospector',
                    lasers: [{
                        laserType: 'arbor',
                        modules: ['none', 'none', 'none']
                    }]
                }],
                gadgets: []
            };

            const serialized = serializeConfig(original.ships, original.gadgets);
            const result = deserializeConfig(serialized);

            expect(result).toBeTruthy();
            expect(result.ships).toEqual(original.ships);
            expect(result.gadgets).toEqual(original.gadgets);
        });

        it('should deserialize configuration with gadgets', () => {
            const original = {
                ships: [{
                    type: 'prospector',
                    lasers: [{
                        laserType: 'helix',
                        modules: ['rieger', 'rieger-c2', 'rieger-c3']
                    }]
                }],
                gadgets: ['sabir', 'optimax']
            };

            const serialized = serializeConfig(original.ships, original.gadgets);
            const result = deserializeConfig(serialized);

            expect(result).toBeTruthy();
            expect(result.ships).toEqual(original.ships);
            expect(result.gadgets).toEqual(original.gadgets);
        });

        it('should deserialize multiple ships', () => {
            const original = {
                ships: [
                    {
                        type: 'prospector',
                        lasers: [{
                            laserType: 'arbor',
                            modules: ['none', 'none', 'none']
                        }]
                    },
                    {
                        type: 'prospector',
                        lasers: [{
                            laserType: 'helix',
                            modules: ['vaux', 'vaux-c2', 'vaux-c3']
                        }]
                    }
                ],
                gadgets: ['sabir']
            };

            const serialized = serializeConfig(original.ships, original.gadgets);
            const result = deserializeConfig(serialized);

            expect(result).toBeTruthy();
            expect(result.ships).toEqual(original.ships);
            expect(result.gadgets).toEqual(original.gadgets);
        });

        it('should return null for invalid input', () => {
            expect(deserializeConfig('invalid-data')).toBeNull();
            expect(deserializeConfig('')).toBeNull();
            expect(deserializeConfig('!@#$%^')).toBeNull();
        });

        it('should return null for malformed JSON', () => {
            // Create an invalid base64 that decodes to invalid JSON
            const invalidBase64 = btoa('{invalid json}');
            expect(deserializeConfig(encodeURIComponent(invalidBase64))).toBeNull();
        });

        it('should validate ships structure', () => {
            // Missing type
            const invalidConfig1 = btoa(JSON.stringify({
                ships: [{ lasers: [] }],
                gadgets: []
            }));
            expect(deserializeConfig(encodeURIComponent(invalidConfig1))).toBeNull();

            // Missing lasers
            const invalidConfig2 = btoa(JSON.stringify({
                ships: [{ type: 'prospector' }],
                gadgets: []
            }));
            expect(deserializeConfig(encodeURIComponent(invalidConfig2))).toBeNull();

            // Invalid laser structure
            const invalidConfig3 = btoa(JSON.stringify({
                ships: [{
                    type: 'prospector',
                    lasers: [{ laserType: 'arbor' }] // Missing modules
                }],
                gadgets: []
            }));
            expect(deserializeConfig(encodeURIComponent(invalidConfig3))).toBeNull();
        });

        it('should validate gadgets are strings', () => {
            const invalidConfig = btoa(JSON.stringify({
                ships: [{
                    type: 'prospector',
                    lasers: [{
                        laserType: 'arbor',
                        modules: ['none']
                    }]
                }],
                gadgets: [123, 456] // Numbers instead of strings
            }));
            expect(deserializeConfig(encodeURIComponent(invalidConfig))).toBeNull();
        });
    });

    describe('Round-trip serialization', () => {
        it('should maintain data integrity through serialize/deserialize cycle', () => {
            const configs = [
                // Simple config
                {
                    ships: [{
                        type: 'prospector',
                        lasers: [{
                            laserType: 'arbor',
                            modules: ['none', 'none', 'none']
                        }]
                    }],
                    gadgets: []
                },
                // Complex config with modules and gadgets
                {
                    ships: [{
                        type: 'prospector',
                        lasers: [{
                            laserType: 'helix',
                            modules: ['rieger', 'rieger-c2', 'rieger-c3']
                        }]
                    }],
                    gadgets: ['sabir', 'optimax']
                },
                // Multiple ships
                {
                    ships: [
                        {
                            type: 'prospector',
                            lasers: [{
                                laserType: 'arbor',
                                modules: ['vaux', 'vaux-c2', 'vaux-c3']
                            }]
                        },
                        {
                            type: 'golem',
                            lasers: [{
                                laserType: 'pitman',
                                modules: ['rieger', 'rieger-c2']
                            }]
                        }
                    ],
                    gadgets: ['sabir', 'boremax']
                }
            ];

            configs.forEach((original, index) => {
                const serialized = serializeConfig(original.ships, original.gadgets);
                const deserialized = deserializeConfig(serialized);

                expect(deserialized, `Config ${index + 1} should deserialize correctly`).toBeTruthy();
                expect(deserialized.ships, `Config ${index + 1} ships should match`).toEqual(original.ships);
                expect(deserialized.gadgets, `Config ${index + 1} gadgets should match`).toEqual(original.gadgets);
            });
        });
    });

    describe('URL-safe encoding', () => {
        it('should produce URL-safe strings', () => {
            const ships = [{
                type: 'prospector',
                lasers: [{
                    laserType: 'arbor',
                    modules: ['none', 'none', 'none']
                }]
            }];
            const gadgets = ['sabir'];

            const serialized = serializeConfig(ships, gadgets);

            // URL-safe characters only (alphanumeric, -, _, ., ~, %)
            expect(serialized).toMatch(/^[A-Za-z0-9\-_.~%]+$/);
        });

        it('should work in URL hash format', () => {
            const ships = [{
                type: 'prospector',
                lasers: [{
                    laserType: 'helix',
                    modules: ['rieger', 'none', 'none']
                }]
            }];
            const gadgets = ['sabir', 'optimax'];

            const serialized = serializeConfig(ships, gadgets);
            const hash = `#config=${serialized}`;

            // Should be a valid URL hash
            expect(hash.startsWith('#config=')).toBe(true);
            expect(hash.length).toBeGreaterThan(8);

            // Extract config from hash
            const extracted = hash.substring(8);
            const deserialized = deserializeConfig(extracted);

            expect(deserialized).toBeTruthy();
            expect(deserialized.ships).toEqual(ships);
            expect(deserialized.gadgets).toEqual(gadgets);
        });
    });
});
