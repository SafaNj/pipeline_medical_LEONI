from django.shortcuts import get_object_or_404


class SiteScopedObjectMixin:
    def get_object(self):
        queryset = self.get_queryset().model._default_manager.all()
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        assert lookup_url_kwarg in self.kwargs, (
            'Expected view %s to be called with a URL keyword argument named "%s". Fix your URL conf, '
            'or set the `.lookup_field` attribute on the view correctly.' %
            (self.__class__.__name__, lookup_url_kwarg)
        )
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)
        self.check_object_permissions(self.request, obj)
        return obj
