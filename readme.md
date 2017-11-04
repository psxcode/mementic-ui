##Goals

[![Greenkeeper badge](https://badges.greenkeeper.io/psxcode/mementic-ui.svg)](https://greenkeeper.io/)
- **Simple and Thin**  
Output code is clean and minimal
- **Modular**  
Build system allows to import only necessary modules into any amount of output files.
- **Override and Extend**  
Anything can be overridden or extended
- **Design Skeleton**  
Provides minimal design skeletons, which you can extend to your needs

##Different levels of abstraction
- **Variables**:  
User changes values of variables which affects different aspects of system during compilation.
- **Functions**:  
Return several vars (in property list form) or calculate result based on vars. User can override functions to implement his own calculations.
- **Prop-placeholders**:  
Used for extension (`@extend`) within the prop-mixins to break dependencies. Cannot be overridden.
- **Prop-mixins**: 
Collection of actual css properties. Can be injected into any selector. Uses `@content` directive. User overrides those to change default css property set for specific selector.
- **User-prop-mixins**:  
Just includes (`@include`) corresponding prop-mixin. User can override those to extend (not to replace completely) default property set.
- **Selector-mixin**:  
Contains selector sets with user-prop-mixins injection. Override those to change selectors relationships and prop-mixin injection.
- **User-selector-mixin**:  
Just includes (`@include`) corresponding selector-mixin. Override those to extend (not to replace completely) default selector-mixins.
