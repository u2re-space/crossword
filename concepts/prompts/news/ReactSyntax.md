Да, к вашему Syntax.ts не хватает ровно «обёртки» для JSX — то есть маленького runtime-а, который принимает JSX и преобразует его в ваши узлы. Ниже — готовый, минимальный и при этом полноценный вариант, совместимый с обоими JSX‑режимами TypeScript (automatic и classic), плюс типы и конфигурация.

План
- Добавляем runtime: jsx-runtime.ts (+ jsx-dev-runtime.ts) и/или createElement для classic.
- Подключаем его через tsconfig: jsx: "react-jsx" и jsxImportSource на ваш пакет.
- Делаем нормализацию детей, поддержку Fragment, key, class/className, style, dangerouslySetInnerHTML, boolean атрибутов и пр.
- Экспортируем типы JSX, чтобы TS «понимал» разметку и возвращаемый вами узел.

1) Ядро: конструктор узлов
Ниже абстрактный createNode. Подставьте вашу конкретную фабрику нод из Syntax.ts (или импортируйте существующие билдеры).

```ts
// src/lure/node/createNode.ts
export type LNode =
  | { kind: 'element'; tag: string | Function; props: Record<string, any>; children: LNode[]; key?: any }
  | { kind: 'text'; value: string }
  | { kind: 'fragment'; children: LNode[]; key?: any };

export const Fragment = Symbol.for('lure.fragment');

function toTextNode(x: any): LNode | null {
  if (x === null || x === undefined || x === false) return null;
  if (typeof x === 'string') return { kind: 'text', value: x };
  if (typeof x === 'number') return { kind: 'text', value: String(x) };
  return x as LNode;
}

function flatten<T>(arr: T[]): T[] {
  const out: T[] = [];
  for (const v of arr) {
    if (Array.isArray(v)) out.push(...flatten(v));
    else out.push(v);
  }
  return out;
}

export function normalizeChildren(children: any[]): LNode[] {
  const flat = flatten(children);
  const out: LNode[] = [];
  for (const c of flat) {
    const n = toTextNode(c);
    if (n) out.push(n);
  }
  return out;
}

function normalizeProps(input?: Record<string, any>): Record<string, any> {
  if (!input) return {};
  const props: Record<string, any> = { ...input };

  // key не должен попадать в props
  delete props.key;

  // className -> class
  if ('className' in props && !('class' in props)) {
    props.class = props.className;
    delete props.className;
  }

  // style: object -> css string
  if (props.style && typeof props.style === 'object' && !Array.isArray(props.style)) {
    const styleObj = props.style as Record<string, string | number>;
    props.style = Object.entries(styleObj)
      .map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${String(v)}`)
      .join(';');
  }

  return props;
}

export function createNode(
  type: any,
  rawProps?: Record<string, any>,
  rawChildren?: any[],
  key?: any
): LNode {
  const props = normalizeProps(rawProps);
  const children = normalizeChildren(rawChildren ?? []);

  // dangerouslySetInnerHTML
  if (props.dangerouslySetInnerHTML?.__html != null) {
    // Ваша реализация: либо создайте спец-ноду, либо атрибут, который SSR/renderer применит как innerHTML.
    // Ниже — простой атрибут:
    // children игнорируем по контракту React
    return {
      kind: 'element',
      tag: type === Fragment ? Fragment : type,
      props,
      children: [],
      key
    };
  }

  if (type === Fragment) {
    return { kind: 'fragment', children, key };
  }

  return {
    kind: 'element',
    tag: type,
    props,
    children,
    key
  };
}
```

2) Automatic runtime (TS "react-jsx")
TypeScript будет импортировать функции jsx/jsxs/Fragment из "<jsxImportSource>/jsx-runtime". Мы просто делегируем в createNode.

```ts
// src/jsx-runtime.ts
import { createNode, Fragment as LFragment } from './lure/node/createNode';

export const Fragment = LFragment;

// jsx: для одного ребёнка (TS будет вызывать именно ее)
export function jsx(type: any, props: any, key?: any) {
  const { children, ...rest } = props ?? {};
  // children тут — одиночный child
  return createNode(type, rest, children === undefined ? [] : [children], key);
}

// jsxs: для массива детей (оптимизированный путь)
export function jsxs(type: any, props: any, key?: any) {
  const { children, ...rest } = props ?? {};
  // children тут — уже массив
  return createNode(type, rest, Array.isArray(children) ? children : [children], key);
}
```

Dev-вариант (опционально — чтобы TS не ругался при jsx: "react-jsxdev"):

```ts
// src/jsx-dev-runtime.ts
export { Fragment, jsx, jsxs } from './jsx-runtime';

// Сигнатура совместима, параметры source/self можно игнорировать
export function jsxDEV(type: any, props: any, key?: any, _isStaticChildren?: boolean, _source?: any, _self?: any) {
  return jsx(type, props, key);
}
```

3) Classic runtime (Babel или tsconfig jsx: "react")
Если нужно, добавляем createElement/Fragment:

```ts
// src/jsx-classic.ts
import { createNode, Fragment as LFragment } from './lure/node/createNode';

export const Fragment = LFragment;

export function createElement(type: any, rawProps?: any, ...restChildren: any[]) {
  const props = rawProps ?? {};
  const key = props.key;
  return createNode(type, props, restChildren, key);
}
```

В classic-режиме TS/ Babel будет генерировать вызовы createElement. Для использования директивы:
/** @jsx createElement */
/** @jsxFrag Fragment */

4) Типы JSX
Чтобы TS «знал», что ваш JSX возвращает ваш LNode и какие элементы допустимы.

```ts
// types/jsx.d.ts
import type { LNode } from '../src/lure/node/createNode';

declare global {
  namespace JSX {
    // То, что возвращают ваши JSX-элементы
    type Element = LNode;

    // Разрешаем любые теги. Можно ужесточить под ваш набор.
    interface IntrinsicElements {
      [elemName: string]: any;
    }

    // Позволяем детям быть строками/числами/узлами/массивами
    type Child = Element | string | number | boolean | null | undefined;
  }
}
```

5) Экспорт из пакета и tsconfig
- Убедитесь, что ваше package.json экспортирует jsx-runtime и jsx-dev-runtime — так TypeScript их найдёт по jsxImportSource.

Пример package.json:

```json
{
  "name": "lure",
  "version": "0.0.0",
  "types": "dist/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "default": "./dist/index.js"
    },
    "./jsx-runtime": {
      "types": "./dist/types/jsx-runtime.d.ts",
      "default": "./dist/jsx-runtime.js"
    },
    "./jsx-dev-runtime": {
      "types": "./dist/types/jsx-dev-runtime.d.ts",
      "default": "./dist/jsx-dev-runtime.js"
    }
  }
}
```

tsconfig.json (automatic runtime):
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "lure", // имя вашего пакета
    "module": "esnext",
    "target": "es2019",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  }
}
```

Classic режим (если нужен):
```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "createElement",
    "jsxFragmentFactory": "Fragment"
  }
}
```

6) Использование
Automatic:
```tsx
/** @jsxImportSource lure */

const node =
  <section id="app" className="root">
    <h1>Hello</h1>
    <button onClick={() => console.log('click')}>Click</button>
    <>
      <span hidden={false}>Visible</span>
      {false}
      {null}
      {[1,2,3].map(n => <i>{n}</i>)}
    </>
  </section>;
```

Classic:
```tsx
/** @jsx createElement */
/** @jsxFrag Fragment */

import { createElement, Fragment } from 'lure/jsx-classic';

const node =
  <div class="wrap" style={{ color: 'red', fontSize: 14 }}>
    {['a', 'b'].map(x => <span key={x}>{x}</span>)}
  </div>;
```

7) Примечания
- key: мы удаляем его из props и сохраняем рядом с нодой — удобно для диффа/гидратации.
- className/class: автосопоставление, но если в props уже есть class — сохраняем его.
- style: объект -> строка CSS; можно заменить на сохранение объекта, если ваш рендерер ожидает именно объект.
- dangerouslySetInnerHTML: по React-контракту игнорируем children, храните __html так, как ожидает ваш renderer/SSR.
- Fragment: отдельный вид ноды, чтобы легко сворачивать/разворачивать без лишней обёртки.

8) Интеграция с вашим Syntax.ts
Если в Syntax.ts уже есть функции-конструкторы (например, el(tag, props, children), txt(value), frag(children)), замените createNode на вызов ваших билдеров и приведите LNode к вашему реальному типу. Места для подстановки отмечены в коде. Если пришлёте сигнатуры ваших билдеров — адаптирую код точечно под вашу структуру.

Нужно максимально строго типизировать props/элементы (например, различать атрибуты для svg/html)? Скажите, и я добавлю IntrinsicElements с нужными интерфейсами.
