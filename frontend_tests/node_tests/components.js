set_global('i18n', global.stub_i18n);

zrequire('components');

var LEFT_KEY = { which: 37 };
var RIGHT_KEY = { which: 39 };

(function test_basics() {
    var keydown_f;
    var click_f;
    var tabs = [];
    var focused_tab;
    var callback_args;

    function make_tab(i) {
        var self = {};

        assert.equal(tabs.length, i);

        self.stub = true;
        self.class = [];

        self.addClass = function (c) {
            self.class += ' ' + c;
            var tokens = self.class.trim().split(/ +/);
            self.class = _.uniq(tokens).join(' ');
        };

        self.removeClass = function (c) {
            var tokens = self.class.trim().split(/ +/);
            self.class = _.without(tokens, c).join(' ');
        };

        self.hasClass = function (c) {
            var tokens = self.class.trim().split(/ +/);
            return tokens.indexOf(c) >= 0;
        };

        self.click = function () {
            click_f.call(this);
        };

        self.data = function (name) {
            assert.equal(name, 'tab-id');
            return i;
        };

        self.focus = function () {
            focused_tab = i;
        };

        self.next = function () {
            return tabs[i+1];
        };

        self.prev = function () {
            return tabs[i-1];
        };

        tabs.push(self);

        return self;
    }

    function selected_tabs() {
        var selected_tabs = _.filter(tabs, function (tab) {
            return tab.hasClass('selected');
        });
        assert.equal(selected_tabs.length, 1);
        selected_tabs.eq = function (idx) {
            assert.equal(idx, 0);
            return selected_tabs[0];
        };
        return selected_tabs;
    }

    var ind_tab = (function () {
        var self = {};

        self.stub = true;

        self.click = function (f) {
            click_f = f;
        };

        self.keydown = function (f) {
            keydown_f = f;
        };

        self.removeClass = function (c) {
            _.each(tabs, function (tab) {
                tab.removeClass(c);
            });
        };

        self.filter = function (sel) {
            switch (sel) {
            case "[data-tab-id='0']":
                return tabs[0];
            case "[data-tab-id='1']":
                return tabs[1];
            default:
                throw Error('unknown selector: ' + sel);
            }
        };

        return self;
    }());

    var switcher = (function () {
        var self = {};

        self.stub = true;

        self.children = [];

        self.append = function (child) {
            self.children.push(child);
        };

        self.find = function (sel) {
            switch (sel) {
            case ".ind-tab":
                return ind_tab;
            case ".ind-tab[data-tab-id='0']":
                return tabs[0];
            case ".selected":
                return selected_tabs();

            default:
                throw Error('unknown selector: ' + sel);
            }
        };

        return self;
    }());

    set_global('$', function (sel) {
        if (sel.stub) {
            // The component often redundantly re-wraps objects.
            return sel;
        }

        switch (sel) {
        case "<div class='tab-switcher'></div>":
            return switcher;
        case "<div class='ind-tab' data-tab-key='keyboard-shortcuts' data-tab-id='0' tabindex='0'>translated: Keyboard shortcuts</div>":
            return make_tab(0);
        case "<div class='ind-tab' data-tab-key='markdown-help' data-tab-id='1' tabindex='0'>translated: Message formatting</div>":
            return make_tab(1);
        case "<div class='ind-tab' data-tab-key='search-operators' data-tab-id='2' tabindex='0'>translated: Search operators</div>":
            return make_tab(2);
        default:
            throw Error('unknown selector: ' + sel);
        }
    });

    var widget = components.toggle({
        name: "info-overlay-toggle",
        selected: 0,
        values: [
            { label: i18n.t("Keyboard shortcuts"), key: "keyboard-shortcuts" },
            { label: i18n.t("Message formatting"), key: "markdown-help" },
            { label: i18n.t("Search operators"), key: "search-operators" },
        ],
        callback: function (name, key) {
            assert.equal(callback_args, undefined);
            callback_args = [name, key];
        },
    });

    assert.equal(widget.get(), switcher);

    assert.deepEqual(switcher.children, tabs);

    assert.equal(focused_tab, 0);
    assert.equal(tabs[0].class, 'first selected');
    assert.equal(tabs[1].class, 'middle');
    assert.equal(tabs[2].class, 'last');
    assert.deepEqual(callback_args, ['translated: Keyboard shortcuts', 'keyboard-shortcuts']);
    assert.equal(widget.value(), 'translated: Keyboard shortcuts');

    callback_args = undefined;

    components.toggle.lookup("info-overlay-toggle").goto('markdown-help');
    assert.equal(focused_tab, 1);
    assert.equal(tabs[0].class, 'first');
    assert.equal(tabs[1].class, 'middle selected');
    assert.equal(tabs[2].class, 'last');
    assert.deepEqual(callback_args, ['translated: Message formatting', 'markdown-help']);
    assert.equal(widget.value(), 'translated: Message formatting');

    callback_args = undefined;

    keydown_f.call(tabs[focused_tab], RIGHT_KEY);
    assert.equal(focused_tab, 2);
    assert.equal(tabs[0].class, 'first');
    assert.equal(tabs[1].class, 'middle');
    assert.equal(tabs[2].class, 'last selected');
    assert.deepEqual(callback_args, ['translated: Search operators', 'search-operators']);
    assert.equal(widget.value(), 'translated: Search operators');

    // try to crash the key handler
    keydown_f.call(tabs[focused_tab], RIGHT_KEY);
    assert.equal(widget.value(), 'translated: Search operators');

    callback_args = undefined;

    keydown_f.call(tabs[focused_tab], LEFT_KEY);
    assert.equal(widget.value(), 'translated: Message formatting');

    callback_args = undefined;

    keydown_f.call(tabs[focused_tab], LEFT_KEY);
    assert.equal(widget.value(), 'translated: Keyboard shortcuts');

    // try to crash the key handler
    keydown_f.call(tabs[focused_tab], LEFT_KEY);
    assert.equal(widget.value(), 'translated: Keyboard shortcuts');
}());
