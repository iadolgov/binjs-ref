/**
 * This module is the primary entry point that takes care of communication
 * with the Rust side over stdin and stdout pipes.
 *
 * Each pipe is expected to be an ND-JSON (newline-delimited JSON) message.
 * Because we're not doing anything asynchronously, it's expected that after
 * each input being sent over the stdin as a separate line, JS will produce
 * an answer on stdout right after, also as a JSON value on a separate line.
 */

'use strict';

const split = require('split');

/**
 * This API should be called with following options:
 * @param {object} opts
 * @param {function=} opts.fromJSON - An optional JSON.parse reviver (see MDN).
 * @param {function} opts.transform - A callback that transforms a parsed value and either returns a result or throws.
 * @param {function=} opts.toJSON - An optional JSON.stringify replacer (see MDN).
 */
module.exports = ({ fromJSON, transform, toJSON }) =>
    process.stdin
        .pipe(
            split(
                line => {
                    try {
                        line = JSON.parse(line, fromJSON);
                        line = transform(line);
                        line = { type: 'Ok', value: line };
                        line = JSON.stringify(line, toJSON);
                    } catch (e) {
                        line = JSON.stringify({
                            type: 'Err',
                            value: e.stack.replace(/\n +/g, ' ')
                        });
                    }
                    return line + '\n';
                },
                null,
                { trailing: false }
            )
        )
        .pipe(process.stdout);
