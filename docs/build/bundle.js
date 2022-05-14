
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Componentes\Capa.svelte generated by Svelte v3.46.4 */

    const file$6 = "src\\Componentes\\Capa.svelte";

    function create_fragment$6(ctx) {
    	let div2;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let h1;
    	let span0;
    	let t2;
    	let span1;
    	let t4;
    	let div0;
    	let a0;
    	let i0;
    	let t5;
    	let a1;
    	let i1;
    	let t6;
    	let a2;
    	let i2;
    	let t7;
    	let a3;
    	let i3;
    	let t8;
    	let a4;
    	let i4;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			span0 = element("span");
    			span0.textContent = "Helton Ricardo";
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Software Developer";
    			t4 = space();
    			div0 = element("div");
    			a0 = element("a");
    			i0 = element("i");
    			t5 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t6 = space();
    			a2 = element("a");
    			i2 = element("i");
    			t7 = space();
    			a3 = element("a");
    			i3 = element("i");
    			t8 = space();
    			a4 = element("a");
    			i4 = element("i");
    			attr_dev(img, "class", "centro-imagem svelte-1o14bfz");
    			if (!src_url_equal(img.src, img_src_value = "./img/minha-imagem.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Minha Imagem");
    			add_location(img, file$6, 88, 4, 1473);
    			attr_dev(span0, "class", "centro-titulo svelte-1o14bfz");
    			add_location(span0, file$6, 90, 6, 1568);
    			attr_dev(span1, "class", "centro-descricao svelte-1o14bfz");
    			add_location(span1, file$6, 91, 6, 1625);
    			add_location(h1, file$6, 89, 4, 1556);
    			attr_dev(i0, "class", "icon fa fa-envelope svelte-1o14bfz");
    			add_location(i0, file$6, 95, 8, 1788);
    			attr_dev(a0, "href", "mailto:helton_ricardo13@hotmail.com");
    			add_location(a0, file$6, 94, 6, 1732);
    			attr_dev(i1, "class", "icon fa fa-instagram svelte-1o14bfz");
    			add_location(i1, file$6, 98, 8, 1913);
    			attr_dev(a1, "href", "https://www.instagram.com/helton.x/");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$6, 97, 6, 1841);
    			attr_dev(i2, "class", "icon fa fa-linkedin svelte-1o14bfz");
    			add_location(i2, file$6, 101, 8, 2046);
    			attr_dev(a2, "href", "https://www.linkedin.com/in/heltonricardo/");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$6, 100, 6, 1967);
    			attr_dev(i3, "class", "icon fa fa-github-alt svelte-1o14bfz");
    			add_location(i3, file$6, 104, 8, 2169);
    			attr_dev(a3, "href", "https://github.com/heltonricardo/");
    			attr_dev(a3, "target", "_blank");
    			add_location(a3, file$6, 103, 6, 2099);
    			attr_dev(div0, "class", "centro-icons svelte-1o14bfz");
    			add_location(div0, file$6, 93, 4, 1698);
    			attr_dev(div1, "class", "centro svelte-1o14bfz");
    			add_location(div1, file$6, 87, 2, 1447);
    			attr_dev(i4, "class", "icon fa fa-chevron-down svelte-1o14bfz");
    			add_location(i4, file$6, 109, 4, 2294);
    			attr_dev(a4, "class", "down svelte-1o14bfz");
    			attr_dev(a4, "href", "#inicio");
    			attr_dev(a4, "data-scroll", "");
    			add_location(a4, file$6, 108, 2, 2242);
    			attr_dev(div2, "class", "fundo svelte-1o14bfz");
    			add_location(div2, file$6, 86, 0, 1424);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, h1);
    			append_dev(h1, span0);
    			append_dev(h1, t2);
    			append_dev(h1, span1);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, i0);
    			append_dev(div0, t5);
    			append_dev(div0, a1);
    			append_dev(a1, i1);
    			append_dev(div0, t6);
    			append_dev(div0, a2);
    			append_dev(a2, i2);
    			append_dev(div0, t7);
    			append_dev(div0, a3);
    			append_dev(a3, i3);
    			append_dev(div2, t8);
    			append_dev(div2, a4);
    			append_dev(a4, i4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Capa', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Capa> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Capa extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Capa",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Componentes\Rodape.svelte generated by Svelte v3.46.4 */

    const file$5 = "src\\Componentes\\Rodape.svelte";

    // (1:0) <script>    const url = "https://www.timeapi.io/api/Time/current/zone?timeZone=Brazil/East";    const requisicao = fetch(url, { mode: "no-cors" }
    function create_catch_block(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>    const url = \\\"https://www.timeapi.io/api/Time/current/zone?timeZone=Brazil/East\\\";    const requisicao = fetch(url, { mode: \\\"no-cors\\\" }",
    		ctx
    	});

    	return block;
    }

    // (20:2) {:then dados}
    function create_then_block(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*dados*/ ctx[1] + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("© ");
    			t1 = text(t1_value);
    			t2 = text(" Helton Ricardo");
    			add_location(span, file$5, 20, 2, 445);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(20:2) {:then dados}",
    		ctx
    	});

    	return block;
    }

    // (18:21)       Carregando informações...    {:then dados}
    function create_pending_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Carregando informações...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(18:21)       Carregando informações...    {:then dados}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let footer;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 1
    	};

    	handle_promise(/*requisicao*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			info.block.c();
    			attr_dev(footer, "class", "svelte-1ie2nv7");
    			add_location(footer, file$5, 16, 0, 361);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			info.block.m(footer, info.anchor = null);
    			info.mount = () => footer;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const url = "https://www.timeapi.io/api/Time/current/zone?timeZone=Brazil/East";

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Rodape', slots, []);
    	const requisicao = fetch(url, { mode: "no-cors" }).then(r => r.json());
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Rodape> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ url, requisicao });
    	return [requisicao];
    }

    class Rodape extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rodape",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Componentes\Secao\TituloDeSecao.svelte generated by Svelte v3.46.4 */

    const file$4 = "src\\Componentes\\Secao\\TituloDeSecao.svelte";

    function create_fragment$4(ctx) {
    	let h1;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			if (default_slot) default_slot.c();
    			attr_dev(h1, "class", "svelte-66uprb");
    			add_location(h1, file$4, 15, 0, 236);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);

    			if (default_slot) {
    				default_slot.m(h1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TituloDeSecao', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TituloDeSecao> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class TituloDeSecao extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TituloDeSecao",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Componentes\Secao\Secao.svelte generated by Svelte v3.46.4 */
    const file$3 = "src\\Componentes\\Secao\\Secao.svelte";

    // (27:2) <Titulo>
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*titulo*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*titulo*/ 1) set_data_dev(t, /*titulo*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(27:2) <Titulo>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let section;
    	let titulo_1;
    	let t;
    	let current;

    	titulo_1 = new TituloDeSecao({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(titulo_1.$$.fragment);
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(section, "class", "svelte-1ruc51j");
    			toggle_class(section, "centralizar", /*centralizar*/ ctx[1]);
    			add_location(section, file$3, 25, 0, 375);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(titulo_1, section, null);
    			append_dev(section, t);

    			if (default_slot) {
    				default_slot.m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const titulo_1_changes = {};

    			if (dirty & /*$$scope, titulo*/ 9) {
    				titulo_1_changes.$$scope = { dirty, ctx };
    			}

    			titulo_1.$set(titulo_1_changes);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[3],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
    						null
    					);
    				}
    			}

    			if (dirty & /*centralizar*/ 2) {
    				toggle_class(section, "centralizar", /*centralizar*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titulo_1.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titulo_1.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(titulo_1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Secao', slots, ['default']);
    	let { titulo } = $$props;
    	let { centralizar = false } = $$props;
    	const writable_props = ['titulo', 'centralizar'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Secao> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('titulo' in $$props) $$invalidate(0, titulo = $$props.titulo);
    		if ('centralizar' in $$props) $$invalidate(1, centralizar = $$props.centralizar);
    		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Titulo: TituloDeSecao, titulo, centralizar });

    	$$self.$inject_state = $$props => {
    		if ('titulo' in $$props) $$invalidate(0, titulo = $$props.titulo);
    		if ('centralizar' in $$props) $$invalidate(1, centralizar = $$props.centralizar);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [titulo, centralizar, slots, $$scope];
    }

    class Secao extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { titulo: 0, centralizar: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Secao",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*titulo*/ ctx[0] === undefined && !('titulo' in props)) {
    			console.warn("<Secao> was created without expected prop 'titulo'");
    		}
    	}

    	get titulo() {
    		throw new Error("<Secao>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set titulo(value) {
    		throw new Error("<Secao>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get centralizar() {
    		throw new Error("<Secao>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set centralizar(value) {
    		throw new Error("<Secao>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Componentes\UI\MargemHorizontal.svelte generated by Svelte v3.46.4 */

    const file$2 = "src\\Componentes\\UI\\MargemHorizontal.svelte";

    function create_fragment$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", /*id*/ ctx[0]);
    			attr_dev(div, "class", "svelte-1vcg20l");
    			add_location(div, file$2, 10, 0, 102);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*id*/ 1) {
    				attr_dev(div, "id", /*id*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('MargemHorizontal', slots, []);
    	let { id = null } = $$props;
    	const writable_props = ['id'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<MargemHorizontal> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({ id });

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(0, id = $$props.id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [id];
    }

    class MargemHorizontal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { id: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MargemHorizontal",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get id() {
    		throw new Error("<MargemHorizontal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<MargemHorizontal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Componentes\UI\Divisao.svelte generated by Svelte v3.46.4 */
    const file$1 = "src\\Componentes\\UI\\Divisao.svelte";

    function create_fragment$1(ctx) {
    	let margemhorizontal0;
    	let t0;
    	let hr;
    	let t1;
    	let margemhorizontal1;
    	let current;
    	margemhorizontal0 = new MargemHorizontal({ $$inline: true });
    	margemhorizontal1 = new MargemHorizontal({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(margemhorizontal0.$$.fragment);
    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			create_component(margemhorizontal1.$$.fragment);
    			attr_dev(hr, "class", "svelte-1q4v7ic");
    			add_location(hr, file$1, 21, 0, 336);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(margemhorizontal0, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(margemhorizontal1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(margemhorizontal0.$$.fragment, local);
    			transition_in(margemhorizontal1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(margemhorizontal0.$$.fragment, local);
    			transition_out(margemhorizontal1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(margemhorizontal0, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t1);
    			destroy_component(margemhorizontal1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Divisao', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Divisao> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ MargemHorizontal });
    	return [];
    }

    class Divisao extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Divisao",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.4 */
    const file = "src\\App.svelte";

    // (15:0) <Secao titulo="Sobre Mim" centralizar>
    function create_default_slot_6(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t2;
    	let strong0;
    	let t4;
    	let strong1;
    	let t6;
    	let strong2;
    	let t8;
    	let em;
    	let t10;
    	let strong3;
    	let t12;
    	let strong4;
    	let t14;
    	let strong5;
    	let t16;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Sou analista desenvolvedor de softwares e entusiasta do mundo da tecnologia.";
    			t1 = space();
    			p1 = element("p");
    			t2 = text("Trabalho no Inatel - Instituto Nacional de Telecomunicações - usando tecnologias como ");
    			strong0 = element("strong");
    			strong0.textContent = "Java";
    			t4 = text(",\n    ");
    			strong1 = element("strong");
    			strong1.textContent = "Spring";
    			t6 = text("\n    e\n    ");
    			strong2 = element("strong");
    			strong2.textContent = "Hibernate";
    			t8 = text(". Nas horas vagas gosto de me arriscar no\n    ");
    			em = element("em");
    			em.textContent = "frontend";
    			t10 = text(" usando ");
    			strong3 = element("strong");
    			strong3.textContent = "JavaScript";
    			t12 = text(",\n    ");
    			strong4 = element("strong");
    			strong4.textContent = "React";
    			t14 = text(" e ");
    			strong5 = element("strong");
    			strong5.textContent = "Svelte ♥";
    			t16 = text(".");
    			add_location(p0, file, 15, 2, 415);
    			add_location(strong0, file, 17, 90, 595);
    			add_location(strong1, file, 18, 4, 622);
    			add_location(strong2, file, 20, 4, 656);
    			add_location(em, file, 21, 4, 728);
    			add_location(strong3, file, 21, 29, 753);
    			add_location(strong4, file, 22, 4, 786);
    			add_location(strong5, file, 22, 29, 811);
    			add_location(p1, file, 16, 2, 501);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t2);
    			append_dev(p1, strong0);
    			append_dev(p1, t4);
    			append_dev(p1, strong1);
    			append_dev(p1, t6);
    			append_dev(p1, strong2);
    			append_dev(p1, t8);
    			append_dev(p1, em);
    			append_dev(p1, t10);
    			append_dev(p1, strong3);
    			append_dev(p1, t12);
    			append_dev(p1, strong4);
    			append_dev(p1, t14);
    			append_dev(p1, strong5);
    			append_dev(p1, t16);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(15:0) <Secao titulo=\\\"Sobre Mim\\\" centralizar>",
    		ctx
    	});

    	return block;
    }

    // (29:0) <Secao titulo="Competências">
    function create_default_slot_5(ctx) {
    	let ul;
    	let li0;
    	let strong0;
    	let t1;
    	let t2;
    	let li1;
    	let strong1;
    	let t4;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			strong0 = element("strong");
    			strong0.textContent = "Proficiência:";
    			t1 = text(" C, Python, Java, Hibernate, Spring, JavaScript, React, Svelte, HTML, CSS e DevOps");
    			t2 = space();
    			li1 = element("li");
    			strong1 = element("strong");
    			strong1.textContent = "Aprendizagem:";
    			t4 = text(" Design Patterns, Docker, Go, Rust, IA e Machine Learning");
    			add_location(strong0, file, 31, 6, 920);
    			add_location(li0, file, 30, 4, 909);
    			add_location(strong1, file, 34, 6, 1058);
    			add_location(li1, file, 33, 4, 1047);
    			add_location(ul, file, 29, 2, 900);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, strong0);
    			append_dev(li0, t1);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(li1, strong1);
    			append_dev(li1, t4);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(29:0) <Secao titulo=\\\"Competências\\\">",
    		ctx
    	});

    	return block;
    }

    // (42:0) <Secao titulo="Projetos">
    function create_default_slot_4(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let ul;
    	let li0;
    	let t3;
    	let li1;
    	let t5;
    	let li2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Projeto #1: IngressoJá!";
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Projeto de plataforma on-line para compra e venda de ingressos;";
    			t3 = space();
    			li1 = element("li");
    			li1.textContent = "Usando Java, Hibernate e SpringBoot para o server side e Svelte para client side;";
    			t5 = space();
    			li2 = element("li");
    			li2.textContent = "Desafios envolvendo comunicação com APIs do Mercado Pago e Amazon AWS.";
    			add_location(h2, file, 43, 4, 1241);
    			add_location(li0, file, 45, 6, 1289);
    			add_location(li1, file, 46, 6, 1368);
    			add_location(li2, file, 47, 6, 1465);
    			add_location(ul, file, 44, 4, 1278);
    			attr_dev(div, "class", "project");
    			add_location(div, file, 42, 2, 1215);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(ul, t5);
    			append_dev(ul, li2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(42:0) <Secao titulo=\\\"Projetos\\\">",
    		ctx
    	});

    	return block;
    }

    // (55:0) <Secao titulo="Experiências">
    function create_default_slot_3(ctx) {
    	let div0;
    	let h20;
    	let t1;
    	let span0;
    	let t3;
    	let ul0;
    	let li0;
    	let t5;
    	let li1;
    	let t7;
    	let li2;
    	let t9;
    	let div1;
    	let h21;
    	let t11;
    	let span1;
    	let t13;
    	let ul1;
    	let li3;
    	let t15;
    	let li4;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "INATEL - Instituto Nacional de Telecomunicações";
    			t1 = space();
    			span0 = element("span");
    			span0.textContent = "Backend Developer, Out 2021 - Atual";
    			t3 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "Java, Hibernate e Spring";
    			t5 = space();
    			li1 = element("li");
    			li1.textContent = "Docker, Kubernetes e Rancher";
    			t7 = space();
    			li2 = element("li");
    			li2.textContent = "Git, GitHub e Azure Devops";
    			t9 = space();
    			div1 = element("div");
    			h21 = element("h2");
    			h21.textContent = "PRODAM - Empresa de Tecnologia da Informação e Comunicação do Município de São Paulo";
    			t11 = space();
    			span1 = element("span");
    			span1.textContent = "Estagiário de Engenharia de Software, Dez 2020 - Out 2021";
    			t13 = space();
    			ul1 = element("ul");
    			li3 = element("li");
    			li3.textContent = "JavaScript, React, Angular, Vue.js e Svelte";
    			t15 = space();
    			li4 = element("li");
    			li4.textContent = "Git, GitHub e Team Fondation Service";
    			add_location(h20, file, 56, 4, 1649);
    			add_location(span0, file, 57, 4, 1710);
    			add_location(li0, file, 59, 6, 1774);
    			add_location(li1, file, 60, 6, 1814);
    			add_location(li2, file, 61, 6, 1858);
    			add_location(ul0, file, 58, 4, 1763);
    			attr_dev(div0, "class", "employments");
    			add_location(div0, file, 55, 2, 1619);
    			add_location(h21, file, 65, 4, 1945);
    			add_location(span1, file, 66, 4, 2043);
    			add_location(li3, file, 68, 6, 2129);
    			add_location(li4, file, 69, 6, 2188);
    			add_location(ul1, file, 67, 4, 2118);
    			attr_dev(div1, "class", "employments");
    			add_location(div1, file, 64, 2, 1915);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h20);
    			append_dev(div0, t1);
    			append_dev(div0, span0);
    			append_dev(div0, t3);
    			append_dev(div0, ul0);
    			append_dev(ul0, li0);
    			append_dev(ul0, t5);
    			append_dev(ul0, li1);
    			append_dev(ul0, t7);
    			append_dev(ul0, li2);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h21);
    			append_dev(div1, t11);
    			append_dev(div1, span1);
    			append_dev(div1, t13);
    			append_dev(div1, ul1);
    			append_dev(ul1, li3);
    			append_dev(ul1, t15);
    			append_dev(ul1, li4);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(55:0) <Secao titulo=\\\"Experiências\\\">",
    		ctx
    	});

    	return block;
    }

    // (77:0) <Secao titulo="Educação">
    function create_default_slot_2(ctx) {
    	let div0;
    	let h20;
    	let t1;
    	let span0;
    	let t3;
    	let div1;
    	let h21;
    	let t5;
    	let span1;
    	let t7;
    	let div2;
    	let h22;
    	let t9;
    	let span2;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "IFSP - Instituto Federal de Educação, Ciência e Tecnologia São Paulo";
    			t1 = space();
    			span0 = element("span");
    			span0.textContent = "Análise e Desenvolvimento de Sistemas, Mar 2019 - Jan 2022";
    			t3 = space();
    			div1 = element("div");
    			h21 = element("h2");
    			h21.textContent = "UNITAU - Universidade de Taubaté";
    			t5 = space();
    			span1 = element("span");
    			span1.textContent = "Engenharia de Computação, Fev 2015 - Jul 2017";
    			t7 = space();
    			div2 = element("div");
    			h22 = element("h2");
    			h22.textContent = "IFSP - Instituto Federal de Educação, Ciência e Tecnologia São Paulo";
    			t9 = space();
    			span2 = element("span");
    			span2.textContent = "Técnico em Informática, Mar 2013 - Nov 2014";
    			add_location(h20, file, 78, 4, 2332);
    			add_location(span0, file, 79, 4, 2414);
    			attr_dev(div0, "class", "education");
    			add_location(div0, file, 77, 2, 2304);
    			add_location(h21, file, 82, 4, 2527);
    			add_location(span1, file, 83, 4, 2573);
    			attr_dev(div1, "class", "education");
    			add_location(div1, file, 81, 2, 2499);
    			add_location(h22, file, 86, 4, 2673);
    			add_location(span2, file, 87, 4, 2755);
    			attr_dev(div2, "class", "education");
    			add_location(div2, file, 85, 2, 2645);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h20);
    			append_dev(div0, t1);
    			append_dev(div0, span0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h21);
    			append_dev(div1, t5);
    			append_dev(div1, span1);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h22);
    			append_dev(div2, t9);
    			append_dev(div2, span2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(77:0) <Secao titulo=\\\"Educação\\\">",
    		ctx
    	});

    	return block;
    }

    // (94:0) <Secao titulo="Conquistas">
    function create_default_slot_1(ctx) {
    	let ul;
    	let li0;
    	let t1;
    	let li1;
    	let t3;
    	let li2;
    	let t5;
    	let li3;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "3º lugar na III Maratona de Programação IFTEC 2020";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "6º lugar na Maratona Estadual de Programação INTERIF 2020";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "4º lugar na primeira etapa da Maratona Estadual de Programação INTERIF 2019";
    			t5 = space();
    			li3 = element("li");
    			li3.textContent = "1º lugar na Maratona de Programação IFSPCJO 2019";
    			add_location(li0, file, 95, 4, 2885);
    			add_location(li1, file, 96, 4, 2949);
    			add_location(li2, file, 97, 4, 3020);
    			add_location(li3, file, 98, 4, 3109);
    			add_location(ul, file, 94, 2, 2876);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(94:0) <Secao titulo=\\\"Conquistas\\\">",
    		ctx
    	});

    	return block;
    }

    // (105:0) <Secao titulo="Contatos" centralizar>
    function create_default_slot(ctx) {
    	let p0;
    	let a0;
    	let t1;
    	let p1;
    	let a1;
    	let t3;
    	let p2;
    	let a2;
    	let t5;
    	let p3;
    	let a3;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			a0 = element("a");
    			a0.textContent = "E-mail";
    			t1 = space();
    			p1 = element("p");
    			a1 = element("a");
    			a1.textContent = "Instagram";
    			t3 = space();
    			p2 = element("p");
    			a2 = element("a");
    			a2.textContent = "GitHub";
    			t5 = space();
    			p3 = element("p");
    			a3 = element("a");
    			a3.textContent = "LinkedIn";
    			attr_dev(a0, "href", "mailto:helton_ricardo13@hotmail.com");
    			add_location(a0, file, 106, 4, 3246);
    			add_location(p0, file, 105, 2, 3238);
    			attr_dev(a1, "href", "https://www.instagram.com/helton.x/");
    			add_location(a1, file, 109, 4, 3320);
    			add_location(p1, file, 108, 2, 3312);
    			attr_dev(a2, "href", "https://github.com/heltonricardo/");
    			add_location(a2, file, 112, 4, 3397);
    			add_location(p2, file, 111, 2, 3389);
    			attr_dev(a3, "href", "https://www.linkedin.com/in/heltonricardo/");
    			add_location(a3, file, 115, 4, 3469);
    			add_location(p3, file, 114, 2, 3461);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, a0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, a1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, a2);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, a3);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(105:0) <Secao titulo=\\\"Contatos\\\" centralizar>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let capa;
    	let t0;
    	let margemhorizontal0;
    	let t1;
    	let secao0;
    	let t2;
    	let divisao0;
    	let t3;
    	let secao1;
    	let t4;
    	let divisao1;
    	let t5;
    	let secao2;
    	let t6;
    	let divisao2;
    	let t7;
    	let secao3;
    	let t8;
    	let divisao3;
    	let t9;
    	let secao4;
    	let t10;
    	let divisao4;
    	let t11;
    	let secao5;
    	let t12;
    	let divisao5;
    	let t13;
    	let secao6;
    	let t14;
    	let margemhorizontal1;
    	let t15;
    	let rodape;
    	let current;
    	capa = new Capa({ $$inline: true });
    	margemhorizontal0 = new MargemHorizontal({ props: { id: "inicio" }, $$inline: true });

    	secao0 = new Secao({
    			props: {
    				titulo: "Sobre Mim",
    				centralizar: true,
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	divisao0 = new Divisao({ $$inline: true });

    	secao1 = new Secao({
    			props: {
    				titulo: "Competências",
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	divisao1 = new Divisao({ $$inline: true });

    	secao2 = new Secao({
    			props: {
    				titulo: "Projetos",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	divisao2 = new Divisao({ $$inline: true });

    	secao3 = new Secao({
    			props: {
    				titulo: "Experiências",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	divisao3 = new Divisao({ $$inline: true });

    	secao4 = new Secao({
    			props: {
    				titulo: "Educação",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	divisao4 = new Divisao({ $$inline: true });

    	secao5 = new Secao({
    			props: {
    				titulo: "Conquistas",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	divisao5 = new Divisao({ $$inline: true });

    	secao6 = new Secao({
    			props: {
    				titulo: "Contatos",
    				centralizar: true,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	margemhorizontal1 = new MargemHorizontal({ $$inline: true });
    	rodape = new Rodape({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(capa.$$.fragment);
    			t0 = space();
    			create_component(margemhorizontal0.$$.fragment);
    			t1 = space();
    			create_component(secao0.$$.fragment);
    			t2 = space();
    			create_component(divisao0.$$.fragment);
    			t3 = space();
    			create_component(secao1.$$.fragment);
    			t4 = space();
    			create_component(divisao1.$$.fragment);
    			t5 = space();
    			create_component(secao2.$$.fragment);
    			t6 = space();
    			create_component(divisao2.$$.fragment);
    			t7 = space();
    			create_component(secao3.$$.fragment);
    			t8 = space();
    			create_component(divisao3.$$.fragment);
    			t9 = space();
    			create_component(secao4.$$.fragment);
    			t10 = space();
    			create_component(divisao4.$$.fragment);
    			t11 = space();
    			create_component(secao5.$$.fragment);
    			t12 = space();
    			create_component(divisao5.$$.fragment);
    			t13 = space();
    			create_component(secao6.$$.fragment);
    			t14 = space();
    			create_component(margemhorizontal1.$$.fragment);
    			t15 = space();
    			create_component(rodape.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(capa, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(margemhorizontal0, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(secao0, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(divisao0, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(secao1, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(divisao1, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(secao2, target, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(divisao2, target, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(secao3, target, anchor);
    			insert_dev(target, t8, anchor);
    			mount_component(divisao3, target, anchor);
    			insert_dev(target, t9, anchor);
    			mount_component(secao4, target, anchor);
    			insert_dev(target, t10, anchor);
    			mount_component(divisao4, target, anchor);
    			insert_dev(target, t11, anchor);
    			mount_component(secao5, target, anchor);
    			insert_dev(target, t12, anchor);
    			mount_component(divisao5, target, anchor);
    			insert_dev(target, t13, anchor);
    			mount_component(secao6, target, anchor);
    			insert_dev(target, t14, anchor);
    			mount_component(margemhorizontal1, target, anchor);
    			insert_dev(target, t15, anchor);
    			mount_component(rodape, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const secao0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				secao0_changes.$$scope = { dirty, ctx };
    			}

    			secao0.$set(secao0_changes);
    			const secao1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				secao1_changes.$$scope = { dirty, ctx };
    			}

    			secao1.$set(secao1_changes);
    			const secao2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				secao2_changes.$$scope = { dirty, ctx };
    			}

    			secao2.$set(secao2_changes);
    			const secao3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				secao3_changes.$$scope = { dirty, ctx };
    			}

    			secao3.$set(secao3_changes);
    			const secao4_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				secao4_changes.$$scope = { dirty, ctx };
    			}

    			secao4.$set(secao4_changes);
    			const secao5_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				secao5_changes.$$scope = { dirty, ctx };
    			}

    			secao5.$set(secao5_changes);
    			const secao6_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				secao6_changes.$$scope = { dirty, ctx };
    			}

    			secao6.$set(secao6_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(capa.$$.fragment, local);
    			transition_in(margemhorizontal0.$$.fragment, local);
    			transition_in(secao0.$$.fragment, local);
    			transition_in(divisao0.$$.fragment, local);
    			transition_in(secao1.$$.fragment, local);
    			transition_in(divisao1.$$.fragment, local);
    			transition_in(secao2.$$.fragment, local);
    			transition_in(divisao2.$$.fragment, local);
    			transition_in(secao3.$$.fragment, local);
    			transition_in(divisao3.$$.fragment, local);
    			transition_in(secao4.$$.fragment, local);
    			transition_in(divisao4.$$.fragment, local);
    			transition_in(secao5.$$.fragment, local);
    			transition_in(divisao5.$$.fragment, local);
    			transition_in(secao6.$$.fragment, local);
    			transition_in(margemhorizontal1.$$.fragment, local);
    			transition_in(rodape.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(capa.$$.fragment, local);
    			transition_out(margemhorizontal0.$$.fragment, local);
    			transition_out(secao0.$$.fragment, local);
    			transition_out(divisao0.$$.fragment, local);
    			transition_out(secao1.$$.fragment, local);
    			transition_out(divisao1.$$.fragment, local);
    			transition_out(secao2.$$.fragment, local);
    			transition_out(divisao2.$$.fragment, local);
    			transition_out(secao3.$$.fragment, local);
    			transition_out(divisao3.$$.fragment, local);
    			transition_out(secao4.$$.fragment, local);
    			transition_out(divisao4.$$.fragment, local);
    			transition_out(secao5.$$.fragment, local);
    			transition_out(divisao5.$$.fragment, local);
    			transition_out(secao6.$$.fragment, local);
    			transition_out(margemhorizontal1.$$.fragment, local);
    			transition_out(rodape.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(capa, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(margemhorizontal0, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(secao0, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(divisao0, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(secao1, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(divisao1, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(secao2, detaching);
    			if (detaching) detach_dev(t6);
    			destroy_component(divisao2, detaching);
    			if (detaching) detach_dev(t7);
    			destroy_component(secao3, detaching);
    			if (detaching) detach_dev(t8);
    			destroy_component(divisao3, detaching);
    			if (detaching) detach_dev(t9);
    			destroy_component(secao4, detaching);
    			if (detaching) detach_dev(t10);
    			destroy_component(divisao4, detaching);
    			if (detaching) detach_dev(t11);
    			destroy_component(secao5, detaching);
    			if (detaching) detach_dev(t12);
    			destroy_component(divisao5, detaching);
    			if (detaching) detach_dev(t13);
    			destroy_component(secao6, detaching);
    			if (detaching) detach_dev(t14);
    			destroy_component(margemhorizontal1, detaching);
    			if (detaching) detach_dev(t15);
    			destroy_component(rodape, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	new SweetScroll();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Capa,
    		Rodape,
    		Secao,
    		Divisao,
    		MargemHorizontal
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({ target: document.body });

    return app;

})();
//# sourceMappingURL=bundle.js.map
