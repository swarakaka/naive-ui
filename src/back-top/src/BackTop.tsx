import {
  h,
  ref,
  computed,
  toRef,
  watch,
  nextTick,
  defineComponent,
  renderSlot,
  mergeProps,
  Transition,
  VNode,
  PropType,
  onMounted,
  onBeforeUnmount
} from 'vue'
import { VLazyTeleport } from 'vueuc'
import { useIsMounted, useMergedState } from 'vooks'
import { getScrollParent, unwrapElement } from 'seemly'
import { useTheme } from '../../_mixins'
import type { ThemeProps } from '../../_mixins'
import { NBaseIcon } from '../../_base'
import { formatLength, warn } from '../../_utils'
import { backTopLight } from '../styles'
import type { BackTopTheme } from '../styles'
import BackTopIcon from './BackTopIcon'
import style from './styles/index.cssr'

export default defineComponent({
  name: 'BackTop',
  inheritAttrs: false,
  props: {
    ...(useTheme.props as ThemeProps<BackTopTheme>),
    show: {
      type: Boolean,
      default: undefined
    },
    right: {
      type: [Number, String],
      default: 40
    },
    bottom: {
      type: [Number, String],
      default: 40
    },
    to: {
      type: [String, Object],
      default: 'body'
    },
    visibilityHeight: {
      type: Number,
      default: 180
    },
    listenTo: {
      type: [String, Object, Function],
      default: undefined
    },
    // eslint-disable-next-line vue/prop-name-casing
    'onUpdate:show': {
      type: Function,
      default: () => {}
    },
    // deprecated
    target: {
      type: Function as PropType<() => HTMLElement | undefined>,
      validator: () => {
        warn(
          'back-top',
          '`target` is deprecated, please use `listen-to` instead.'
        )
        return true
      },
      default: undefined
    },
    onShow: {
      type: Function as PropType<(() => void) | undefined>,
      default: undefined
    },
    onHide: {
      type: Function as PropType<(() => void) | undefined>,
      default: undefined
    }
  },
  setup (props) {
    const scrollTopRef = ref<number | null>(null)
    const uncontrolledShowRef = computed(() => {
      if (scrollTopRef.value === null) return false
      return scrollTopRef.value >= props.visibilityHeight
    })
    const DomInfoReadyRef = ref(false)
    watch(uncontrolledShowRef, (value) => {
      if (DomInfoReadyRef.value) {
        props['onUpdate:show'](value)
      }
    })
    const controlledShowRef = toRef(props, 'show')
    const mergedShowRef = useMergedState(controlledShowRef, uncontrolledShowRef)
    const transitionDisabledRef = ref(true)
    const placeholderRef = ref<HTMLElement | null>(null)
    const styleRef = computed((): {
      right: string
      bottom: string
    } => {
      return {
        right: formatLength(props.right),
        bottom: formatLength(props.bottom)
      }
    })
    let scrollElement: HTMLElement
    let scrollListenerRegistered: boolean
    // deprecated
    watch(mergedShowRef, (value) => {
      if (DomInfoReadyRef.value) {
        if (value) {
          props.onShow?.()
        }
        props.onHide?.()
      }
    })
    const themeRef = useTheme('BackTop', 'BackTop', style, backTopLight, props)
    function init (): void {
      if (scrollListenerRegistered) return
      scrollListenerRegistered = true
      const scrollEl =
        props.target?.() ||
        unwrapElement(props.listenTo) ||
        getScrollParent(placeholderRef.value)
      if (!scrollEl) {
        if (__DEV__) {
          warn(
            'back-top',
            'Container of back-top element is not found. This could be a bug of naive-ui.'
          )
        }
        return
      }
      scrollElement = scrollEl
      const { to } = props
      const target = typeof to === 'string' ? document.querySelector(to) : to
      if (__DEV__ && !target) {
        warn('back-top', 'Target is not found.')
      }
      if (scrollEl) {
        scrollEl.addEventListener('scroll', handleScroll)
        handleScroll()
      }
    }
    function handleClick (e: MouseEvent): void {
      if (scrollElement.nodeName === '#document') {
        ;((scrollElement as unknown) as Document).documentElement.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      } else {
        scrollElement.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }
    }
    function handleScroll (): void {
      if (scrollElement.nodeName === '#document') {
        scrollTopRef.value = ((scrollElement as unknown) as Document).documentElement.scrollTop
      } else {
        scrollTopRef.value = scrollElement.scrollTop
      }
      if (!DomInfoReadyRef.value) {
        void nextTick(() => {
          DomInfoReadyRef.value = true
        })
      }
    }
    function handleAfterEnter (): void {
      transitionDisabledRef.value = false
    }
    onMounted(() => {
      init()
      transitionDisabledRef.value = mergedShowRef.value
    })
    onBeforeUnmount(() => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll)
      }
    })

    return {
      placeholderRef,
      style: styleRef,
      mergedShow: mergedShowRef,
      isMounted: useIsMounted(),
      scrollElement: ref(null),
      scrollTop: scrollTopRef,
      DomInfoReady: DomInfoReadyRef,
      transitionDisabled: transitionDisabledRef,
      handleAfterEnter,
      handleScroll,
      handleClick,
      cssVars: computed(() => {
        const {
          self: {
            color,
            boxShadow,
            boxShadowHover,
            boxShadowPressed,
            iconColor,
            iconColorHover,
            iconColorPressed,
            width,
            height,
            iconSize,
            borderRadius,
            textColor
          },
          common: { cubicBezierEaseInOut }
        } = themeRef.value
        return {
          '--bezier': cubicBezierEaseInOut,
          '--border-radius': borderRadius,
          '--height': height,
          '--width': width,
          '--box-shadow': boxShadow,
          '--box-shadow-hover': boxShadowHover,
          '--box-shadow-pressed': boxShadowPressed,
          '--color': color,
          '--icon-size': iconSize,
          '--icon-color': iconColor,
          '--icon-color-hover': iconColorHover,
          '--icon-color-pressed': iconColorPressed,
          '--text-color': textColor
        }
      })
    }
  },
  render () {
    return (
      <div
        ref="placeholderRef"
        class="n-back-top-placeholder"
        style="display: none"
        aria-hidden
      >
        <VLazyTeleport to={this.to} show={this.mergedShow}>
          {{
            default: () => (
              <Transition
                name="n-fade-in-scale-up-transition"
                appear={this.isMounted}
                onAfterEnter={this.handleAfterEnter}
              >
                {{
                  default: () =>
                    this.mergedShow
                      ? h(
                        'div',
                        mergeProps(this.$attrs, {
                          class: [
                            'n-back-top',
                            {
                              'n-back-top--transition-disabled': this
                                .transitionDisabled
                            }
                          ],
                          style: {
                            ...this.style,
                            ...this.cssVars
                          },
                          onClick: this.handleClick
                        }),
                        [
                          renderSlot(
                            this.$slots,
                            'default',
                            undefined,
                            () => [
                              (
                                <NBaseIcon>
                                  {{ default: () => BackTopIcon }}
                                </NBaseIcon>
                              ) as VNode
                            ]
                          )
                        ]
                      )
                      : null
                }}
              </Transition>
            )
          }}
        </VLazyTeleport>
      </div>
    )
  }
})
